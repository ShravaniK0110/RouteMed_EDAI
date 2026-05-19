import { NextResponse } from 'next/server';
import { verifyAuthHeader, JWTPayload } from '@/lib/auth';

type Role = JWTPayload['role'];

/**
 * Require valid JWT authentication
 */
export function requireAuth(
  req: Request
): JWTPayload | NextResponse {

  const user = verifyAuthHeader(
    req.headers.get('authorization')
  );

  if (!user) {

    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized'
      },
      {
        status: 401
      }
    );
  }

  return user;
}

/**
 * Require specific role(s)
 */
export function requireRole(
  req: Request,
  ...roles: Role[]
): JWTPayload | NextResponse {

  const user = verifyAuthHeader(
    req.headers.get('authorization')
  );

  if (!user) {

    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized'
      },
      {
        status: 401
      }
    );
  }

  // Role check
  if (!roles.includes(user.role)) {

    return NextResponse.json(
      {
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`
      },
      {
        status: 403
      }
    );
  }

  return user;
}