import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { TRANSACTIONS, ACCOUNTS } from '../graphql/operations.js';
import {
  formatMoney,
  formatDate,
  transactionLabel,
  isCredit,
} from '../utils/format.js';

const PAGE_SIZE = 10;
const TYPES = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT'];

export default function Transactions() {
  const [page, setPage] = useState(0);
  const [accountId, setAccountId] = useState('');
  const [type, setType] = useState('');

  const { data: accountsData } = useQuery(ACCOUNTS);
  const filter = {};
  if (accountId) filter.accountId = accountId;
  if (type) filter.type = type;

  const { data, loading } = useQuery(TRANSACTIONS, {
    variables: { filter, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
    fetchPolicy: 'cache-and-network',
  });

  const items = data?.transactions?.items ?? [];
  const totalCount = data?.transactions?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const accounts = accountsData?.accounts ?? [];

  function resetPageAnd(setter) {
    return (value) => {
      setPage(0);
      setter(value);
    };
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>

      <div className="flex flex-wrap gap-3">
        <select
          value={accountId}
          onChange={(e) => resetPageAnd(setAccountId)(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.accountNumber}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => resetPageAnd(setType)(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {transactionLabel(t)}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        {loading && items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No transactions match your filters.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Account</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-5 py-3 font-medium">{transactionLabel(tx.type)}</td>
                  <td className="px-5 py-3 font-mono text-slate-500">
                    {tx.account.accountNumber}
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">
          {totalCount} transaction{totalCount === 1 ? '' : 's'} · Page {page + 1} of{' '}
          {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
            disabled={page + 1 >= totalPages}
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
