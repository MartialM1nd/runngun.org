import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

import { SITE_OWNER_PUBKEY, ADMIN_LIST_DTAG, DEFAULT_ADMIN_PUBKEYS } from '@/lib/config';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const STORAGE_KEY = 'runngun:admin-list';

export function useAdminList() {
  const { nostr } = useNostr();
  const [persistedAdmins, setPersistedAdmins] = useLocalStorage<string[]>(
    STORAGE_KEY,
    DEFAULT_ADMIN_PUBKEYS,
  );

  const query = useQuery({
    queryKey: ['admin-list', SITE_OWNER_PUBKEY],
    queryFn: async ({ signal }) => {
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

      if (events.length === 0) {
        setPersistedAdmins(DEFAULT_ADMIN_PUBKEYS);
        return DEFAULT_ADMIN_PUBKEYS;
      }

      const content = events[0].content;
      const pubkeys = JSON.parse(content);

      if (Array.isArray(pubkeys)) {
        const validPubkeys = pubkeys.filter(
          (pk): pk is string => typeof pk === 'string' && /^[0-9a-fA-F]{64}$/.test(pk)
        );
        setPersistedAdmins(validPubkeys);
        return validPubkeys;
      }

      return DEFAULT_ADMIN_PUBKEYS;
    },
    staleTime: 15_000,
    retry: 2,
    placeholderData: persistedAdmins,
    initialData: DEFAULT_ADMIN_PUBKEYS,
  });

  return query;
}
