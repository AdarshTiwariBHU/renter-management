import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const AUTH_SECRET = process.env.AUTH_SECRET || 'fallback_super_secret_jwt_key_32chars_minimum_security';
const TOKEN_COOKIE_NAME = 'renters_auth_token';

export interface AuthPayload {
  userId: string;
  email: string;
  username: string;
  loginId?: string;
  name: string;
  role: string;
  renterId?: string;
  tokenVersion?: number;
}

export function isAdminRole(role?: string): boolean {
  if (!role) return false;
  const r = role.toUpperCase();
  return r === 'ADMIN' || r === 'MANAGER';
}

export function isRenterRole(role?: string): boolean {
  if (!role) return false;
  return role.toUpperCase() === 'RENTER';
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, AUTH_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function getAuthFromRequest(request: NextRequest): AuthPayload | null {
  const cookie = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  if (!cookie) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return verifyToken(authHeader.substring(7));
    }
    return null;
  }
  return verifyToken(cookie);
}

/**
 * Validates the session token AND verifies the user against MongoDB in real-time.
 * If the user has been marked VACATED, SUSPENDED, REJECTED, or loginEnabled is false,
 * this function immediately rejects the request.
 */
export async function verifySessionUser(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return null;

  try {
    // Dynamic import to avoid circular dependency
    const { connectToDatabase } = await import('@/lib/db');
    const User = (await import('@/models/User')).default;

    await connectToDatabase();
    const user = await User.findById(auth.userId);
    if (!user) return null;

    // Check account validity
    if (
      user.status === 'VACATED' ||
      user.status === 'SUSPENDED' ||
      user.status === 'REJECTED' ||
      user.status === 'PENDING_VERIFICATION' ||
      user.loginEnabled === false
    ) {
      return null;
    }

    // Session revocation check (Logout from all devices)
    const currentTokenVersion = user.tokenVersion || 0;
    const tokenVersionInAuth = auth.tokenVersion || 0;
    if (tokenVersionInAuth < currentTokenVersion) {
      return null;
    }

    return { auth, user };
  } catch (err) {
    console.error('Session user verification error:', err);
    return null;
  }
}

export { TOKEN_COOKIE_NAME };
