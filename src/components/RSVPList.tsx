import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { RSVPEvent } from '@/hooks/useEventRSVPs';

interface RSVPListProps {
  going: RSVPEvent[];
  tentative: RSVPEvent[];
}

export function RSVPList({ going, tentative }: RSVPListProps) {
  const isEmpty = going.length === 0 && tentative.length === 0;

  if (isEmpty) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">Be the first to RSVP!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {going.length > 0 && (
        <div>
          <h3 className="font-condensed text-sm font-bold uppercase tracking-wide text-foreground mb-3">
            Going ({going.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {going.map((rsvp) => (
              <UserBadge key={rsvp.pubkey} pubkey={rsvp.pubkey} />
            ))}
          </div>
        </div>
      )}

      {tentative.length > 0 && (
        <div>
          <h3 className="font-condensed text-sm font-bold uppercase tracking-wide text-foreground mb-3">
            Maybe ({tentative.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {tentative.map((rsvp) => (
              <UserBadge key={rsvp.pubkey} pubkey={rsvp.pubkey} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserBadge({ pubkey }: { pubkey: string }) {
  const { data: author } = useAuthor(pubkey);
  const name = author?.metadata?.name ?? genUserName(pubkey);
  const picture = author?.metadata?.picture;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border">
      <Avatar className="w-6 h-6">
        <AvatarImage src={picture} />
        <AvatarFallback className="text-xs">
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm text-foreground truncate max-w-[150px]">{name}</span>
    </div>
  );
}