export function formatMoney(decimalString, currency = 'USD') {
  const num = Number(decimalString);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(Number.isFinite(num) ? num : 0);
}

export function formatDate(value) {
  const d = new Date(value);
  return d.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const LABELS = {
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
  TRANSFER_IN: 'Transfer In',
  TRANSFER_OUT: 'Transfer Out',
};

export function transactionLabel(type) {
  return LABELS[type] ?? type;
}

export function isCredit(type) {
  return type === 'DEPOSIT' || type === 'TRANSFER_IN';
}
