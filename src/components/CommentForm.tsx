import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePublishComment } from '@/hooks/usePublishComment';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';

interface CommentFormProps {
  eventId: string;
  authorPubkey: string;
  onSuccess?: () => void;
}

export function CommentForm({ eventId, authorPubkey, onSuccess }: CommentFormProps) {
  const { user } = useCurrentUser();
  const { mutateAsync: publishComment, isPending } = usePublishComment();
  const [content, setContent] = useState('');

  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await publishComment(eventId, content.trim(), authorPubkey);
    setContent('');
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[80px] resize-none"
        disabled={isPending}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!content.trim() || isPending}
          size="sm"
          className="font-condensed font-bold uppercase tracking-wide"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Post Comment
        </Button>
      </div>
    </form>
  );
}