// Money is stored as BigInt minor units (cents). These helpers convert to/from
// the decimal strings exposed through the GraphQL API.

export function centsToDecimalString(cents) {
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  const whole = abs / 100n;
  const frac = abs % 100n;
  const fracStr = frac.toString().padStart(2, '0');
  return `${negative ? '-' : ''}${whole.toString()}.${fracStr}`;
}

// Generates a pseudo-random 12-digit account number.
export function generateAccountNumber() {
  let n = '';
  for (let i = 0; i < 12; i += 1) {
    n += Math.floor(Math.random() * 10).toString();
  }
  return n;
}
