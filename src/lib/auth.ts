import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.JWT_SECRET as string;

if (!SECRET_KEY) {
  throw new Error(
    'FATAL: JWT_SECRET is not defined in environment variables.'
  );
}

export interface JWTPayload {
  id: string;
  role: 'admin' | 'paramedic' | 'patient';
  name?: string;
  phone?: string;
  email?: string;
}

export function verifyJWT(
  token: string
): JWTPayload | null {

  try {

    const decoded = jwt.verify(
      token,
      SECRET_KEY
    ) as JWTPayload;

    return decoded;

  } catch (error) {

    console.error(
      '[AUTH] JWT Verification Failed:',
      error
    );

    return null;
  }
}

export function generateJWT(
  payload: JWTPayload
) {

  return jwt.sign(
    payload,
    SECRET_KEY,
    {
      expiresIn: '24h',
    }
  );
}

export async function hashPassword(
  password: string
) {

  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string
) {

  return bcrypt.compare(password, hash);
}

export function extractTokenFromHeader(
  authHeader?: string | null
) {

  if (!authHeader) return null;

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
}

export function verifyAuthHeader(
  authHeader?: string | null
): JWTPayload | null {

  const token =
    extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  return verifyJWT(token);
}

export function hasRole(
  user: JWTPayload | null,
  role: JWTPayload['role']
) {

  if (!user) return false;

  return user.role === role;
}