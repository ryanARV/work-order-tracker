import { cookies } from 'next/headers';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE_NAME = 'session';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TECH' | 'SERVICE_WRITER' | 'PARTS' | 'MANAGER';
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  try {
    const userId = Buffer.from(sessionId, 'base64').toString('utf-8');
    const user = await prisma.user.findUnique({
      where: { id: userId, active: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden - Admin access required');
  }
  return user;
}

export async function requireTech(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== 'TECH') {
    throw new Error('Forbidden - Technician access required');
  }
  return user;
}

export async function requireServiceWriter(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== 'SERVICE_WRITER' && user.role !== 'ADMIN') {
    throw new Error('Forbidden - Service Writer access required');
  }
  return user;
}

export async function requireParts(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== 'PARTS' && user.role !== 'ADMIN') {
    throw new Error('Forbidden - Parts access required');
  }
  return user;
}

export async function requireManager(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    throw new Error('Forbidden - Manager access required');
  }
  return user;
}

// Permission helper functions
export function canManageWorkOrders(user: SessionUser): boolean {
  return ['ADMIN', 'SERVICE_WRITER', 'MANAGER'].includes(user.role);
}

export function canManageParts(user: SessionUser): boolean {
  return ['ADMIN', 'PARTS', 'MANAGER'].includes(user.role);
}

export function canTrackTime(user: SessionUser): boolean {
  return ['ADMIN', 'TECH'].includes(user.role);
}

export function canManageTime(user: SessionUser): boolean {
  return ['ADMIN', 'MANAGER'].includes(user.role);
}

export function canCreateEstimates(user: SessionUser): boolean {
  return ['ADMIN', 'SERVICE_WRITER', 'MANAGER'].includes(user.role);
}

export function canViewKanban(user: SessionUser): boolean {
  return ['ADMIN', 'SERVICE_WRITER', 'MANAGER'].includes(user.role);
}

export async function login(email: string, password: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email, active: true },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  const sessionId = Buffer.from(user.id).toString('base64');
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
