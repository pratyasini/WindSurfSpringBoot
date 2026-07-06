import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import {
  ACCOUNTS,
  CREATE_ACCOUNT,
  TRANSACTIONS,
} from '../graphql/operations.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import MoneyActionForm from '../components/MoneyActionForm.jsx';
import {
  formatMoney,
  formatDate,
  transactionLabel,
  isCredit,
} from '../utils/format.js';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading } = useQuery(ACCOUNTS);
  const { data: txData } = useQuery(TRANSACTIONS, {
    variables: { limit: 5, offset: 0 },
  });
  const [createAccount, { loading: creating }] = useMutation(CREATE_ACCOUNT, {
    refetchQueries: [{ query: ACCOUNTS }],
  });

  const [modal, setModal] = useState({ open: false, action: null, account: null });

  const accounts = data?.accounts ?? [];
  const recent = txData?.transactions?.items ?? [];
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  function openModal(action, account) {
    setModal({ open: true, action, account });
  }
  function closeModal() {
    setModal({ open: false, action: null, account: null });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-slate-500">
            Total balance across {accounts.length} account
            {accounts.length === 1 ? '' : 's'}:{' '}
            <span className="font-semibold text-slate-700">
              {formatMoney(totalBalance)}
            </span>
          </p>
        </div>
        <button
          onClick={() => createAccount()}
          disabled={creating}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {creating ? 'Creating…' : '+ New Account'}
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-500">You don&apos;t have any accounts yet.</p>
          <button
            onClick={() => createAccount()}
            className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Open your first account
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {account.currency} Account
                  </p>
                  <p className="font-mono text-sm text-slate-500">
                    {account.accountNumber}
                  </p>
                </div>
                <Link
                  to={`/accounts/${account.id}`}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  Details →
                </Link>
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-800">
                {formatMoney(account.balance, account.currency)}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openModal('deposit', account)}
                  className="flex-1 rounded-lg bg-emerald-50 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  Deposit
                </button>
                <button
                  onClick={() => openModal('withdraw', account)}
                  className="flex-1 rounded-lg bg-amber-50 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
                >
                  Withdraw
                </button>
                <button
                  onClick={() => openModal('transfer', account)}
                  className="flex-1 rounded-lg bg-brand-50 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
                >
                  Transfer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent transactions</h2>
          <Link to="/transactions" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          {recent.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{transactionLabel(tx.type)}</p>
                    <p className="text-xs text-slate-400">
                      {tx.account.accountNumber} · {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      isCredit(tx.type) ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {isCredit(tx.type) ? '+' : '-'}
                    {formatMoney(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal
        open={modal.open}
        title={modal.action ? `${modal.action[0].toUpperCase()}${modal.action.slice(1)}` : ''}
        onClose={closeModal}
      >
        {modal.account && (
          <MoneyActionForm
            action={modal.action}
            account={modal.account}
            onDone={closeModal}
          />
        )}
      </Modal>
    </div>
  );
}
