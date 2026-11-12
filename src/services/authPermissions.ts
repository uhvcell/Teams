import { storageService } from './storage';
import { isAdminSessionActive, getAdminSessionEmail } from './adminSessionManager';

export type AdminRoleType = 'SUPER ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface CurrentAdminInfo {
  name: string;
  email: string;
  role: string;
  roleType: AdminRoleType;
  canDelete: boolean;
}

export function normalizeRole(roleStr: string): AdminRoleType {
  const upper = (roleStr || '').trim().toUpperCase();
  if (upper.includes('SUPER')) return 'SUPER ADMIN';
  if (upper.includes('VIEWER') || upper.includes('GUEST')) return 'VIEWER';
  if (upper.includes('EDITOR') || upper.includes('CONTENT')) return 'EDITOR';
  return 'ADMIN';
}

export function canRoleDeleteStudent(roleStr?: string): boolean {
  if (!roleStr) return false;
  const normalized = normalizeRole(roleStr);
  // SUPER ADMIN and ADMIN have student deletion permissions.
  // EDITOR and VIEWER are strictly forbidden.
  return normalized === 'SUPER ADMIN' || normalized === 'ADMIN';
}

export function getCurrentAdminInfo(): CurrentAdminInfo {
  const isLoggedIn = isAdminSessionActive();
  const email = getAdminSessionEmail();

  if (!isLoggedIn || !email) {
    return {
      name: 'Unauthenticated User',
      email: '',
      role: 'Viewer',
      roleType: 'VIEWER',
      canDelete: false,
    };
  }

  const admins = storageService.getAdminUsers();
  const matched = admins.find((a) => a.email.toLowerCase() === email.toLowerCase());

  const role = matched?.role || (email.includes('admin') ? 'Super Admin' : 'Admin');
  const roleType = normalizeRole(role);

  return {
    name: matched?.name || (roleType === 'SUPER ADMIN' ? 'Dr. M. Sreenivasa Rao' : 'Administrator'),
    email,
    role,
    roleType,
    canDelete: canRoleDeleteStudent(role),
  };
}
