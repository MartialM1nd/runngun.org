import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

import { ADMIN_LIST_DTAG, TEMPLATES_DTAG } from '@/lib/config';

export interface EventTemplate {
  id: string;
  name: string;
  title: string;
  summary: string;
  content: string;
  location: string;
  image: string;
  price: string;
  links: string[];
}

interface NostrTemplate {
  id: string;
  name: string;
  title: string;
  summary: string;
  content: string;
  location: string;
  image: string;
  links: string[];
}

function parseNostrTemplate(tags: string[][]): NostrTemplate | null {
  const id = tags.find(([t]) => t === 'id')?.[1];
  const name = tags.find(([t]) => t === 'name')?.[1];
  const title = tags.find(([t]) => t === 'title')?.[1];
  const summary = tags.find(([t]) => t === 'summary')?.[1];
  const content = tags.find(([t]) => t === 'content')?.[1];
  const location = tags.find(([t]) => t === 'location')?.[1];
  const image = tags.find(([t]) => t === 'image')?.[1];
  const links = tags.filter(([t]) => t === 'link').map(([, url]) => url);

  if (!id || !name) return null;

  return { id, name, title: title ?? '', summary: summary ?? '', content: content ?? '', location: location ?? '', image: image ?? '', links };
}

export function useTemplateList(adminPubkeys: string[]) {
  const { nostr } = useNostr();

  const query = useQuery({
    queryKey: ['template-list'],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [
          {
            kinds: [30078],
            authors: adminPubkeys,
            '#d': [TEMPLATES_DTAG],
            limit: 1,
          },
        ],
        { signal }
      );

      if (events.length === 0) {
        return [];
      }

      const content = events[0].content;
      try {
        const templates: EventTemplate[] = JSON.parse(content);
        if (Array.isArray(templates)) {
          return templates.filter((t): t is EventTemplate => 
            typeof t.id === 'string' && typeof t.name === 'string'
          );
        }
      } catch {
        // Invalid content
      }
      return [];
    },
    staleTime: 30_000,
  });

  return query;
}
