import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { ACCOUNT } from '../graphql/operations.js';
import {
  formatMoney,
  formatDate,
  transactionLabel,
  isCredit,
} from '../utils/format.js';

export default function AccountDetails() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(ACCOUNT, { variables: { id } });

  if (loading) return <p className="text-slate-500">Loading account…</p>;
  if (error) return <p className="text-red-600">{error.message}</p>;

  const account = data?.account;
  if (!account) return <p className="text-slate-500">Account not found.</p>;

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-brand-600 hover:underline">
        ← Back to dashboard
      </Link>

      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white shadow">
        <p className="text-sm text-brand-100">{account.currency} Account</p>
        <p className="font-mono text-lg">{account.accountNumber}</p>
        <p className="mt-4 text-4xl font-bold">
          {formatMoney(account.balance, account.currency)}
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Transaction history</h2>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          {account.transactions.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No transactions yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {account.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-5 py-3 font-medium">{transactionLabel(tx.type)}</td>
                    <td className="px-5 py-3 text-slate-500">{tx.description || '—'}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(tx.createdAt)}</td>
                    <td
                      className={`px-5 py-3 text-right font-semibold ${
                        isCredit(tx.type) ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {isCredit(tx.type) ? '+' : '-'}
                      {formatMoney(tx.amount)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {formatMoney(tx.balanceAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
