import { gql } from '@apollo/client';

export const REGISTER = gql`
  mutation Register($email: String!, $name: String!, $password: String!) {
    register(email: $email, name: $name, password: $password) {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

export const ME = gql`
  query Me {
    me {
      id
      name
      email
      role
    }
  }
`;

export const ACCOUNTS = gql`
  query Accounts {
    accounts {
      id
      accountNumber
      balance
      currency
      createdAt
    }
  }
`;

export const ACCOUNT = gql`
  query Account($id: ID!) {
    account(id: $id) {
      id
      accountNumber
      balance
      currency
      transactions(limit: 50) {
        id
        type
        amount
        balanceAfter
        description
        createdAt
      }
    }
  }
`;

export const TRANSACTIONS = gql`
  query Transactions($filter: TransactionFilter, $limit: Int, $offset: Int) {
    transactions(filter: $filter, limit: $limit, offset: $offset) {
      totalCount
      items {
        id
        type
        amount
        balanceAfter
        description
        createdAt
        account {
          id
          accountNumber
        }
      }
    }
  }
`;

export const CREATE_ACCOUNT = gql`
  mutation CreateAccount($currency: String) {
    createAccount(currency: $currency) {
      id
      accountNumber
      balance
      currency
    }
  }
`;

export const DEPOSIT = gql`
  mutation Deposit($accountId: ID!, $amount: String!, $description: String) {
    deposit(accountId: $accountId, amount: $amount, description: $description) {
      id
      balanceAfter
    }
  }
`;

export const WITHDRAW = gql`
  mutation Withdraw($accountId: ID!, $amount: String!, $description: String) {
    withdraw(accountId: $accountId, amount: $amount, description: $description) {
      id
      balanceAfter
    }
  }
`;

export const TRANSFER = gql`
  mutation Transfer(
    $fromAccountId: ID!
    $toAccountNumber: String!
    $amount: String!
    $description: String
  ) {
    transfer(
      fromAccountId: $fromAccountId
      toAccountNumber: $toAccountNumber
      amount: $amount
      description: $description
    ) {
      id
      balanceAfter
    }
  }
`;
