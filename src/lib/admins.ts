const STORAGE_KEY = 'nostr:admins';

const HARDCODED_ADMIN_PUBKEYS: string[] = [
  '5748528068b958db3f33cf0ebf63096f8c780d719a18decaf4df12ea3421a15f',
  'ac391a41b2cfb30d77480b5c32322e1989db91db89a253775162871677d1954e',
];

export const ADMIN_PUBKEYS: string[] = HARDCODED_ADMIN_PUBKEYS;

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
  return [...HARDCODED_ADMIN_PUBKEYS, ...getStoredAdmins()];
}

export const SITE_OWNER_PUBKEY = HARDCODED_ADMIN_PUBKEYS[0];

export function isAdmin(pubkey: string): boolean {
  return getAllAdmins().includes(pubkey);
}