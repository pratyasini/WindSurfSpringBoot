import { GraphQLError } from 'graphql';

function invalid(message) {
  throw new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  if (!email || !EMAIL_RE.test(email)) {
    invalid('A valid email address is required.');
  }
  return email.toLowerCase().trim();
}

export function validatePassword(password) {
  if (!password || password.length < 8) {
    invalid('Password must be at least 8 characters long.');
  }
  return password;
}

export function validateName(name) {
  if (!name || name.trim().length < 2) {
    invalid('Name must be at least 2 characters long.');
  }
  return name.trim();
}

// Parses a decimal money string/number into positive integer minor units (cents).
export function validateAmount(amount) {
  const num = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(num) || num <= 0) {
    invalid('Amount must be a positive number.');
  }
  const cents = Math.round(num * 100);
  if (cents <= 0) {
    invalid('Amount must be at least 0.01.');
  }
  return BigInt(cents);
}
