import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';

export function usePublishComment() {
  const { mutate, isPending } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const publishComment = (
    eventId: string,
    content: string,
    authorPubkey: string,
    replyToEventId?: string
  ) => {
    const tags: string[][] = [
      ['e', eventId],
      ['p', authorPubkey],
    ];

    if (replyToEventId) {
      tags.push(['e', replyToEventId]);
    }

    mutate(
      {
        kind: 1,
        content,
        tags,
      },
      {
        onSuccess: () => {
          toast({ title: 'Comment posted' });
          queryClient.invalidateQueries({ queryKey: ['comments'] });
        },
        onError: (err) => {
          console.error('Failed to publish comment:', err);
          toast({
            title: 'Failed to post comment',
            variant: 'destructive',
          });
        },
      },
    );
  };

  return { mutateAsync: publishComment, isPending };
}