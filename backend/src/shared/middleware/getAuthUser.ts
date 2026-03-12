import { UnauthorizedError } from '../utils/errors';
import type { AuthRequest, AuthUser } from '../types';

export function getAuthUser(req: AuthRequest): AuthUser {
  if (!req.user) throw new UnauthorizedError('Authentication required');
  return req.user;
}
