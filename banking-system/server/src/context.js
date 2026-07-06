import { verifyToken } from './auth.js';
import { prisma } from './prisma.js';

// Builds the per-request GraphQL context. Resolves the current user from the
// Authorization: Bearer <token> header, if present.
export async function buildContext({ req }) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  let user = null;
  if (token) {
    const payload = verifyToken(token);
    if (payload?.sub) {
      user = await prisma.user.findUnique({ where: { id: payload.sub } });
    }
  }

  return { prisma, user };
}
