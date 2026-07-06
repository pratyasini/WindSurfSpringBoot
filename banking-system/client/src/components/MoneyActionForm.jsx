import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { DEPOSIT, WITHDRAW, TRANSFER } from '../graphql/operations.js';

const MUTATIONS = { deposit: DEPOSIT, withdraw: WITHDRAW, transfer: TRANSFER };

// action: 'deposit' | 'withdraw' | 'transfer'
export default function MoneyActionForm({ action, account, onDone }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [toAccountNumber, setToAccountNumber] = useState('');

  const [mutate, { loading, error }] = useMutation(MUTATIONS[action], {
    // Refetch by operation name so active queries are refreshed with their
    // current variables (e.g. the dashboard's paginated recent-transactions).
    refetchQueries: ['Accounts', 'Transactions', 'Account'],
    onCompleted: onDone,
  });

  function handleSubmit(e) {
    e.preventDefault();
    const base = { accountId: account.id, amount, description };
    if (action === 'transfer') {
      mutate({
        variables: {
          fromAccountId: account.id,
          toAccountNumber,
          amount,
          description,
        },
      });
    } else {
      mutate({ variables: base });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-500">
        Account <span className="font-mono">{account.accountNumber}</span> · Balance{' '}
        <span className="font-semibold">{account.balance}</span>
      </p>
      {action === 'transfer' && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            Destination account number
          </label>
          <input
            value={toAccountNumber}
            onChange={(e) => setToAccountNumber(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="123456789012"
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium">Amount</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="100.00"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description (optional)</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Rent, savings, etc."
        />
      </div>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error.message}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? 'Processing…' : `Confirm ${action}`}
      </button>
    </form>
  );
}
