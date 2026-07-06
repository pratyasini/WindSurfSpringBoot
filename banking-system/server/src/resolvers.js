import { GraphQLError } from 'graphql';
import {
  hashPassword,
  verifyPassword,
  signToken,
  requireAuth,
} from './auth.js';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateAmount,
} from './validation.js';
import { centsToDecimalString, generateAccountNumber } from './money.js';
import { logger } from './logger.js';

function notFound(message) {
  throw new GraphQLError(message, { extensions: { code: 'NOT_FOUND' } });
}

function forbidden(message) {
  throw new GraphQLError(message, { extensions: { code: 'FORBIDDEN' } });
}

// Loads an account and asserts the current user owns it (or is an admin).
async function loadOwnedAccount(prisma, user, accountId) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) notFound('Account not found.');
  if (account.ownerId !== user.id && user.role !== 'ADMIN') {
    forbidden('You do not have access to this account.');
  }
  return account;
}

export const resolvers = {
  Query: {
    me: (_parent, _args, ctx) => ctx.user,

    users: async (_parent, _args, ctx) => {
      const user = requireAuth(ctx);
      if (user.role !== 'ADMIN') forbidden('Admin access required.');
      return ctx.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    },

    accounts: async (_parent, _args, ctx) => {
      const user = requireAuth(ctx);
      return ctx.prisma.account.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: 'asc' },
      });
    },

    account: async (_parent, { id }, ctx) => {
      const user = requireAuth(ctx);
      return loadOwnedAccount(ctx.prisma, user, id);
    },

    transactions: async (_parent, { filter, limit, offset }, ctx) => {
      const user = requireAuth(ctx);
      const ownedAccounts = await ctx.prisma.account.findMany({
        where: { ownerId: user.id },
        select: { id: true },
      });
      const ownedIds = ownedAccounts.map((a) => a.id);

      const where = { accountId: { in: ownedIds } };
      if (filter?.accountId) {
        if (!ownedIds.includes(filter.accountId)) {
          forbidden('You do not have access to this account.');
        }
        where.accountId = filter.accountId;
      }
      if (filter?.type) {
        where.type = filter.type;
      }

      const [items, totalCount] = await Promise.all([
        ctx.prisma.transaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: Math.min(limit ?? 20, 100),
          skip: offset ?? 0,
        }),
        ctx.prisma.transaction.count({ where }),
      ]);

      return { items, totalCount };
    },
  },

  Mutation: {
    register: async (_parent, { email, name, password }, ctx) => {
      const cleanEmail = validateEmail(email);
      const cleanName = validateName(name);
      validatePassword(password);

      const existing = await ctx.prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      if (existing) {
        throw new GraphQLError('An account with this email already exists.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const passwordHash = await hashPassword(password);
      const user = await ctx.prisma.user.create({
        data: { email: cleanEmail, name: cleanName, passwordHash },
      });
      logger.info('user.registered', { userId: user.id });
      return { token: signToken(user), user };
    },

    login: async (_parent, { email, password }, ctx) => {
      const cleanEmail = validateEmail(email);
      const user = await ctx.prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      const ok = user && (await verifyPassword(password, user.passwordHash));
      if (!ok) {
        throw new GraphQLError('Invalid email or password.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      logger.info('user.login', { userId: user.id });
      return { token: signToken(user), user };
    },

    createAccount: async (_parent, { currency }, ctx) => {
      const user = requireAuth(ctx);
      // Retry on the (extremely unlikely) account-number collision.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          return await ctx.prisma.account.create({
            data: {
              accountNumber: generateAccountNumber(),
              currency: currency ?? 'USD',
              ownerId: user.id,
            },
          });
        } catch (err) {
          if (err.code === 'P2002' && attempt < 4) continue;
          throw err;
        }
      }
      throw new GraphQLError('Could not allocate an account number.', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    },

    deposit: async (_parent, { accountId, amount, description }, ctx) => {
      const user = requireAuth(ctx);
      const cents = validateAmount(amount);
      await loadOwnedAccount(ctx.prisma, user, accountId);

      return ctx.prisma.$transaction(async (tx) => {
        const account = await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: cents } },
        });
        const record = await tx.transaction.create({
          data: {
            type: 'DEPOSIT',
            amount: cents,
            balanceAfter: account.balance,
            description,
            accountId,
          },
        });
        logger.info('tx.deposit', { accountId, amount: cents.toString() });
        return record;
      });
    },

    withdraw: async (_parent, { accountId, amount, description }, ctx) => {
      const user = requireAuth(ctx);
      const cents = validateAmount(amount);
      await loadOwnedAccount(ctx.prisma, user, accountId);

      return ctx.prisma.$transaction(async (tx) => {
        const current = await tx.account.findUnique({ where: { id: accountId } });
        if (current.balance < cents) {
          throw new GraphQLError('Insufficient funds.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        const account = await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: cents } },
        });
        const record = await tx.transaction.create({
          data: {
            type: 'WITHDRAWAL',
            amount: cents,
            balanceAfter: account.balance,
            description,
            accountId,
          },
        });
        logger.info('tx.withdraw', { accountId, amount: cents.toString() });
        return record;
      });
    },

    transfer: async (
      _parent,
      { fromAccountId, toAccountNumber, amount, description },
      ctx,
    ) => {
      const user = requireAuth(ctx);
      const cents = validateAmount(amount);
      const from = await loadOwnedAccount(ctx.prisma, user, fromAccountId);

      const to = await ctx.prisma.account.findUnique({
        where: { accountNumber: toAccountNumber },
      });
      if (!to) notFound('Destination account not found.');
      if (to.id === from.id) {
        throw new GraphQLError('Cannot transfer to the same account.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // ACID: debit + credit + both ledger rows commit atomically.
      return ctx.prisma.$transaction(async (tx) => {
        const source = await tx.account.findUnique({
          where: { id: fromAccountId },
        });
        if (source.balance < cents) {
          throw new GraphQLError('Insufficient funds.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        const debited = await tx.account.update({
          where: { id: fromAccountId },
          data: { balance: { decrement: cents } },
        });
        const credited = await tx.account.update({
          where: { id: to.id },
          data: { balance: { increment: cents } },
        });
        const outRecord = await tx.transaction.create({
          data: {
            type: 'TRANSFER_OUT',
            amount: cents,
            balanceAfter: debited.balance,
            description,
            accountId: fromAccountId,
            counterpartId: to.id,
          },
        });
        await tx.transaction.create({
          data: {
            type: 'TRANSFER_IN',
            amount: cents,
            balanceAfter: credited.balance,
            description,
            accountId: to.id,
            counterpartId: fromAccountId,
          },
        });
        logger.info('tx.transfer', {
          from: fromAccountId,
          to: to.id,
          amount: cents.toString(),
        });
        return outRecord;
      });
    },
  },

  User: {
    accounts: (parent, _args, ctx) =>
      ctx.prisma.account.findMany({ where: { ownerId: parent.id } }),
  },

  Account: {
    balance: (parent) => centsToDecimalString(parent.balance),
    owner: (parent, _args, ctx) =>
      ctx.prisma.user.findUnique({ where: { id: parent.ownerId } }),
    transactions: (parent, { limit, offset }, ctx) =>
      ctx.prisma.transaction.findMany({
        where: { accountId: parent.id },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit ?? 20, 100),
        skip: offset ?? 0,
      }),
    createdAt: (parent) => parent.createdAt.toISOString(),
  },

  Transaction: {
    amount: (parent) => centsToDecimalString(parent.amount),
    balanceAfter: (parent) => centsToDecimalString(parent.balanceAfter),
    account: (parent, _args, ctx) =>
      ctx.prisma.account.findUnique({ where: { id: parent.accountId } }),
    counterpartAccount: (parent, _args, ctx) =>
      parent.counterpartId
        ? ctx.prisma.account.findUnique({ where: { id: parent.counterpartId } })
        : null,
    createdAt: (parent) => parent.createdAt.toISOString(),
  },
};
