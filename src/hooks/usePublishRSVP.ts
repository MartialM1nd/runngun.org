import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import { nip19 } from 'nostr-tools';

export function usePublishRSVP() {
  const { mutate, isPending } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const publishRSVP = (eventNaddr: string, status: 'going' | 'tentative') => {
    const decoded = decodeNaddr(eventNaddr);
    if (!decoded) {
      toast({ title: 'Invalid event', variant: 'destructive' });
      return;
    }

    const { kind, pubkey, identifier } = decoded;
    const aTag = `${kind}:${pubkey}:${identifier}`;
    const dTag = `${aTag}:${status}`;

    mutate(
      {
        kind: 31925,
        content: '',
        tags: [
          ['a', aTag],
          ['d', dTag],
          ['status', status === 'going' ? 'accepted' : 'tentative'],
          ['p', pubkey],
        ],
      },
      {
        onSuccess: () => {
          toast({
            title: status === 'going' ? 'You\'re going!' : 'Marked as maybe',
            description: status === 'going' 
              ? 'Your RSVP has been recorded.' 
              : 'Your maybe response has been recorded.',
          });
          queryClient.invalidateQueries({ queryKey: ['rsvps'] });
        },
        onError: (err) => {
          console.error('Failed to publish RSVP:', err);
          toast({
            title: 'Failed to RSVP',
            description: 'There was an error recording your response.',
            variant: 'destructive',
          });
        },
      },
    );
  };

  return { mutateAsync: publishRSVP, isPending };
}

function decodeNaddr(naddr: string): { kind: number; pubkey: string; identifier: string } | null {
  try {
    const decoded = nip19.decode(naddr);
    if (decoded.type !== 'naddr') return null;
    return decoded.data;
  } catch {
    return null;
  }
}