import { SITE_OWNER_PUBKEY, DEFAULT_ADMIN_PUBKEYS } from './config';

export { SITE_OWNER_PUBKEY, DEFAULT_ADMIN_PUBKEYS };

const STORAGE_KEY = 'nostr:admins';

export function getStoredAdmins(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function setStoredAdmins(pubkeys: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pubkeys));
}

export function addAdmin(pubkey: string): void {
  const current = getStoredAdmins();
  if (!current.includes(pubkey)) {
    setStoredAdmins([...current, pubkey]);
  }
}

export function removeAdmin(pubkey: string): void {
  const current = getStoredAdmins();
  setStoredAdmins(current.filter(pk => pk !== pubkey));
}

export function getAllAdmins(): string[] {
  return [...DEFAULT_ADMIN_PUBKEYS, ...getStoredAdmins()];
}

export function isAdmin(pubkey: string): boolean {
  return getAllAdmins().includes(pubkey);
}
