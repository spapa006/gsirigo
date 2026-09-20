import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export const SESSION_COOKIE = 'gsirigo_admin';
const SESSION_DAYS = 7;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    // Fail loudly in production; dev-only fallback keeps preview usable.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET must be set to at least 32 characters.');
    }
    return new TextEncoder().encode('gsirigo-dev-only-secret-not-for-prod-key-1234567890');
  }
  return new TextEncoder().encode(secret);
}

export type AdminSession = {
  sub: 'admin';
  email: string;
  issuedAt: number;
  expiresAt: number;
};

function encodeSession(session: AdminSession): Promise<string> {
  return new SignJWT({
    email: session.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('admin')
    .setIssuedAt(session.issuedAt)
    .setExpirationTime(session.expiresAt)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    });
    if (payload.sub !== 'admin' || typeof payload.email !== 'string') return null;
    return {
      sub: 'admin',
      email: payload.email,
      issuedAt: payload.iat ?? 0,
      expiresAt: payload.exp ?? 0,
    };
  } catch {
    return null;
  }
}

/** Creates (and stores) a new session cookie. Used by the login route. */
export async function createSessionCookie() {
  const now = Math.floor(Date.now() / 1000);
  const session: AdminSession = {
    sub: 'admin',
    email: process.env.ADMIN_EMAIL ?? 'admin@gsirigo.com',
    issuedAt: now,
    expiresAt: now + SESSION_DAYS * 24 * 60 * 60,
  };
  const token = await encodeSession(session);

  const all = await cookies();
  all.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySessionCookie() {
  const all = await cookies();
  all.delete(SESSION_COOKIE);
}

/** Server-side session check for route handlers / server components. */
export async function getServerSession(): Promise<AdminSession | null> {
  const all = await cookies();
  const token = all.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Session check against a NextRequest (proxy.ts middleware). */
export async function getRequestSession(
  request: NextRequest
): Promise<AdminSession | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}