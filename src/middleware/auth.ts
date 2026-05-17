import { NextResponse } from 'next/server';
import { verifyAuthHeader, JWTPayload } from '@/lib/auth';

type Role = JWTPayload['role'];

/**
 * Extracts and verifies the JWT from the Authorization header.
 * Returns the decoded user payload or a 401 NextResponse.
 *
 * Usage in any route:
 *   const auth = requireAuth(req);
 *   if (auth instanceof NextResponse) return auth;
 *   // auth is now JWTPayload
 */
export function requireAuth(req: Request): JWTPayload | NextResponse {
  const user = verifyAuthHeader(req.headers.get('authorization'));
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return user;
}

/**
 * Requires auth AND a specific role.
 *
 * Usage:
 *   const auth = requireRole(req, 'paramedic');
 *   if (auth instanceof NextResponse) return auth;
 */
export function requireRole(req: Request, ...roles: Role[]): JWTPayload | NextResponse {
  const user = verifyAuthHeader(req.headers.get('authorization'));
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!roles.includes(user.role)) {
    return NextResponse.json(
      { success: false, error: `Access denied. Required role: ${roles.join(' or ')}` },
      { status: 403 }
    );
  }
  return user;
}