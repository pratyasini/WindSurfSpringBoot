import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function accountNumber() {
  let n = '';
  for (let i = 0; i < 12; i += 1) n += Math.floor(Math.random() * 10);
  return n;
}

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      passwordHash,
      accounts: {
        create: [
          { accountNumber: accountNumber(), balance: 150000n, currency: 'USD' },
          { accountNumber: accountNumber(), balance: 25000n, currency: 'USD' },
        ],
      },
    },
    include: { accounts: true },
  });

  await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      passwordHash,
      accounts: {
        create: [{ accountNumber: accountNumber(), balance: 50000n, currency: 'USD' }],
      },
    },
  });

  console.log('Seeded users: alice@example.com / bob@example.com (password: password123)');
  console.log('Alice accounts:', alice.accounts.map((a) => a.accountNumber).join(', '));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
