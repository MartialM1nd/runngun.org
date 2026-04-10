import { type NostrEvent, type NostrMetadata, NSchema as n } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

interface AuthorData {
  event?: NostrEvent;
  metadata?: NostrMetadata;
}

export function useAuthors(pubkeys: string[]) {
  const { nostr } = useNostr();

  return useQuery<Record<string, AuthorData>>({
    queryKey: ['nostr', 'authors', pubkeys.sort().join(',')],
    queryFn: async () => {
      if (pubkeys.length === 0) {
        return {};
      }

      const events = await nostr.query(
        [{ kinds: [0], authors: pubkeys, limit: pubkeys.length }],
        { signal: AbortSignal.timeout(3000) },
      );

      const result: Record<string, AuthorData> = {};

      for (const pubkey of pubkeys) {
        const event = events.find(e => e.pubkey === pubkey);
        if (event) {
          try {
            const metadata = n.json().pipe(n.metadata()).parse(event.content);
            result[pubkey] = { metadata, event };
          } catch {
            result[pubkey] = { event };
          }
        } else {
          result[pubkey] = {};
        }
      }

      return result;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: pubkeys.length > 0,
  });
}
