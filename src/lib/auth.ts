import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.JWT_SECRET as string;

if (!SECRET_KEY) {
  throw new Error("FATAL: JWT_SECRET is not defined in the environment variables.");
}

export function verifyJWT(token: string) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded as any;
  } catch (error) {
    return null;
  }
}

// Renamed to generateJWT so your admin route can find it
export function generateJWT(payload: any) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
}

// Added this to handle the password checking in your login route
export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}