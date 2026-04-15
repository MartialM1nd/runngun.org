import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

import { SITE_OWNER_PUBKEY, ADMIN_LIST_DTAG, DEFAULT_ADMIN_PUBKEYS } from '@/lib/config';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const STORAGE_KEY = 'runngun:admin-list';
const LEGACY_STORAGE_KEY = 'nostr:admins';

function getLegacyStoredAdmins(): string[] {
  try {
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function getInitialData(): string[] {
  const legacyAdmins = getLegacyStoredAdmins();
  return [...new Set([...DEFAULT_ADMIN_PUBKEYS, ...legacyAdmins])];
}

export function useAdminList() {
  const { nostr } = useNostr();
  const [persistedAdmins, setPersistedAdmins] = useLocalStorage<string[]>(
    STORAGE_KEY,
    getInitialData(),
  );

  const query = useQuery({
    queryKey: ['admin-list', SITE_OWNER_PUBKEY],
    queryFn: async ({ signal }) => {
      const legacyAdmins = getLegacyStoredAdmins();
      
      const events = await nostr.query(
        [
          {
            kinds: [30078],
            authors: [SITE_OWNER_PUBKEY],
            '#d': [ADMIN_LIST_DTAG],
            limit: 1,
          },
        ],
        { signal }
      );

      let nostrPubkeys: string[] = [];

      if (events.length > 0) {
        const content = events[0].content;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          nostrPubkeys = parsed.filter(
            (pk): pk is string => typeof pk === 'string' && /^[0-9a-fA-F]{64}$/.test(pk)
          );
        }
      }

      const allAdmins = [...new Set([...DEFAULT_ADMIN_PUBKEYS, ...nostrPubkeys, ...legacyAdmins])];
      setPersistedAdmins(allAdmins);
      return allAdmins;
    },
    staleTime: 0,
    refetchOnMount: true,
    retry: 2,
    initialData: getInitialData(),
  });

  return query;
}
