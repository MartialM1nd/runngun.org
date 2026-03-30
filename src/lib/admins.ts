/**
 * Admin pubkeys for runngun.org
 *
 * These pubkeys are authorized to publish/manage events and access the /admin panel.
 * Add additional admin pubkeys as hex strings to this array.
 *
 * The first entry (index 0) is treated as the site owner pubkey.
 */
export const ADMIN_PUBKEYS: string[] = [
  // Site owner pubkey — replace with your own hex pubkey
  // To get your hex pubkey: decode your npub using a NIP-19 decoder
  'ac391a41b2cfb30d77480b5c32322e1989db91db89a253775162871677d1954e',
];

/** The primary site owner pubkey (used for admin config queries) */
export const SITE_OWNER_PUBKEY = ADMIN_PUBKEYS[0];

/** Check if a pubkey is an admin */
export function isAdmin(pubkey: string): boolean {
  return ADMIN_PUBKEYS.includes(pubkey);
}
