import gql from 'graphql-tag';

export const typeDefs = gql`
  enum Role {
    USER
    ADMIN
  }

  enum TransactionType {
    DEPOSIT
    WITHDRAWAL
    TRANSFER_IN
    TRANSFER_OUT
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: Role!
    accounts: [Account!]!
    createdAt: String!
  }

  type Account {
    id: ID!
    accountNumber: String!
    "Balance as a decimal string, e.g. \\"1234.56\\""
    balance: String!
    currency: String!
    owner: User!
    transactions(limit: Int, offset: Int): [Transaction!]!
    createdAt: String!
  }

  type Transaction {
    id: ID!
    type: TransactionType!
    "Amount as a decimal string, always positive"
    amount: String!
    "Account balance immediately after this transaction"
    balanceAfter: String!
    description: String
    account: Account!
    counterpartAccount: Account
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type TransactionConnection {
    items: [Transaction!]!
    totalCount: Int!
  }

  input TransactionFilter {
    accountId: ID
    type: TransactionType
  }

  type Query {
    "Current authenticated user"
    me: User
    "Admin only: list all users"
    users: [User!]!
    "Accounts owned by the current user"
    accounts: [Account!]!
    "Single account by id (must be owned by current user unless admin)"
    account(id: ID!): Account
    "Transactions for the current user, with pagination and filtering"
    transactions(
      filter: TransactionFilter
      limit: Int = 20
      offset: Int = 0
    ): TransactionConnection!
  }

  type Mutation {
    register(email: String!, name: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createAccount(currency: String): Account!
    deposit(accountId: ID!, amount: String!, description: String): Transaction!
    withdraw(accountId: ID!, amount: String!, description: String): Transaction!
    transfer(
      fromAccountId: ID!
      toAccountNumber: String!
      amount: String!
      description: String
    ): Transaction!
  }
`;
