# Basic Banking System

A production-ready, full-stack banking web application supporting user authentication, account management, and ACID-safe money transactions.

**Stack**

| Layer     | Technology                                             |
| --------- | ------------------------------------------------------ |
| Frontend  | React 18 (hooks), Apollo Client, React Router, Tailwind CSS, Vite |
| Backend   | Node.js, Apollo Server 4 (GraphQL), Prisma ORM         |
| Database  | PostgreSQL                                             |
| Auth      | JWT (Bearer tokens), bcrypt password hashing           |

---

## Project Structure

```
banking-system/
├── server/                       # GraphQL API
│   ├── prisma/
│   │   ├── schema.prisma         # User → Account → Transaction models
│   │   └── seed.js               # Demo users + accounts
│   └── src/
│       ├── index.js              # Apollo Server bootstrap + error formatting
│       ├── schema.js             # GraphQL typeDefs
│       ├── resolvers.js          # Query + Mutation resolvers
│       ├── context.js            # Per-request auth context (resolves JWT → user)
│       ├── auth.js               # hash/verify password, sign/verify JWT, requireAuth
│       ├── validation.js         # Input validation (email, password, amount)
│       ├── money.js              # BigInt cents ↔ decimal string helpers
│       ├── prisma.js             # PrismaClient singleton
│       ├── logger.js             # Structured JSON logger
│       └── config.js             # Env config
└── client/                       # React SPA
    └── src/
        ├── main.jsx              # ApolloProvider + Router + AuthProvider
        ├── App.jsx               # Routes (public + protected)
        ├── apollo.js             # Apollo Client + auth link (attaches Bearer token)
        ├── context/AuthContext.jsx
        ├── graphql/operations.js # All queries & mutations
        ├── components/           # Navbar, Layout, Modal, ProtectedRoute, MoneyActionForm
        ├── pages/                # Login, Register, Dashboard, AccountDetails, Transactions
        └── utils/format.js       # Money/date formatting
```

---

## Getting Started

### 1. Database

Provision a PostgreSQL database and note its connection string.

```bash
createdb banking   # or use Docker: docker run -e POSTGRES_PASSWORD=banking -p 5432:5432 postgres
```

### 2. Backend

```bash
cd server
cp .env.example .env          # set DATABASE_URL and JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate        # creates tables
npm run seed                  # optional: demo users (alice@example.com / password123)
npm run dev                   # GraphQL at http://localhost:4000
```

### 3. Frontend

```bash
cd client
cp .env.example .env          # set VITE_GRAPHQL_URI (default http://localhost:4000/)
npm install
npm run dev                   # app at http://localhost:5173
```

---

## Data Model

```
User (id, email, name, passwordHash, role)
  └── 1..* Account (id, accountNumber, balance, currency)
              └── 1..* Transaction (id, type, amount, balanceAfter, counterpartId)
```

- **Money** is stored as `BigInt` **minor units (cents)** to eliminate floating-point rounding errors. It is exposed through the API as a decimal string (e.g. `"1234.56"`).
- **Referential integrity**: `Account.ownerId` and `Transaction.accountId` are foreign keys with `onDelete: Cascade`.
- **Every transaction records `balanceAfter`**, giving an immutable running ledger.

---

## Security

- Passwords hashed with **bcrypt** (never stored or returned in plaintext).
- Stateless **JWT** auth. The client stores the token and sends `Authorization: Bearer <token>`; `context.js` resolves it to the current user on every request.
- `requireAuth(ctx)` guards every protected resolver; `users` additionally requires the `ADMIN` role.
- Every account/transaction resolver verifies **ownership** before returning data or mutating balances.
- Input validation on email, password length, and positive amounts.

---

## Sample Queries & Mutations

### Register / Login

```graphql
mutation {
  login(email: "alice@example.com", password: "password123") {
    token
    user { id name email }
  }
}
```

Send the returned `token` as a header on subsequent requests:

```json
{ "Authorization": "Bearer <token>" }
```

### Create Account

```graphql
mutation {
  createAccount(currency: "USD") {
    id
    accountNumber
    balance
  }
}
```

### Transfer Money

```graphql
mutation {
  transfer(
    fromAccountId: "<uuid>"
    toAccountNumber: "123456789012"
    amount: "250.00"
    description: "Rent"
  ) {
    id
    balanceAfter
  }
}
```

---

## API Flow Explanation

### Account Creation

1. Client calls `createAccount` with the JWT attached.
2. `context.js` verifies the token and loads the `User`.
3. `requireAuth` ensures a user is present.
4. Resolver generates a unique 12-digit account number (retrying on the rare unique-constraint collision) and inserts an `Account` with `balance = 0`, owned by the user.
5. The new account is returned and the dashboard refetches `accounts`.

### Fund Transfer (ACID-safe)

1. Client calls `transfer(fromAccountId, toAccountNumber, amount)`.
2. Resolver validates the amount (`> 0`), loads the **source** account and asserts ownership, then looks up the **destination** by account number.
3. Everything runs inside `prisma.$transaction(...)` so it is atomic:
   - Re-read the source balance and **reject if funds are insufficient** (overdraft prevention).
   - Decrement the source balance, increment the destination balance.
   - Insert a `TRANSFER_OUT` ledger row for the source and a `TRANSFER_IN` row for the destination, each recording `balanceAfter`.
4. If any step throws, the whole transaction rolls back — balances and ledger never diverge.

---

## Optional Enhancements (implemented)

- **Pagination** — the `transactions` query accepts `limit`/`offset` and returns `totalCount`; the Transactions page has Previous/Next paging.
- **Filtering** — filter transactions by account and by type.
- **Dashboard analytics** — total balance across accounts and a recent-transactions feed.
