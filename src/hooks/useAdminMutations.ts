import { useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

import { SITE_OWNER_PUBKEY, ADMIN_LIST_DTAG, DEFAULT_ADMIN_PUBKEYS } from '@/lib/config';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';

export function useAdminMutations() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isSiteOwner = user?.pubkey === SITE_OWNER_PUBKEY;

  const addAdmin = async (pubkey: string) => {
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'You must be logged in to add admins',
        variant: 'destructive',
      });
      return;
    }

    if (!isSiteOwner) {
      toast({
        title: 'Permission denied',
        description: 'Only the site owner can add admins',
        variant: 'destructive',
      });
      return;
    }

    try {
      const events = await nostr.query([
        {
          kinds: [30078],
          authors: [SITE_OWNER_PUBKEY],
          '#d': [ADMIN_LIST_DTAG],
          limit: 1,
        },
      ]);

      let currentPubkeys: string[] = DEFAULT_ADMIN_PUBKEYS;
      if (events.length > 0) {
        const content = events[0].content;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentPubkeys = parsed.filter(
            (pk): pk is string => typeof pk === 'string' && /^[0-9a-fA-F]{64}$/.test(pk)
          );
        }
      }

      if (currentPubkeys.some(pk => pk.toLowerCase() === pubkey.toLowerCase())) {
        toast({
          title: 'Admin already exists',
          description: 'This pubkey is already an admin',
          variant: 'destructive',
        });
        return;
      }

      const newPubkeys = [...currentPubkeys, pubkey];

      const event = await user.signer.signEvent({
        kind: 30078,
        content: JSON.stringify(newPubkeys),
        tags: [
          ['d', ADMIN_LIST_DTAG],
          ['alt', 'runngun.org admin list'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(event, { signal: AbortSignal.timeout(10000) });

      queryClient.invalidateQueries({ queryKey: ['admin-list'] });

      toast({
        title: 'Admin added',
        description: 'New admin has been added successfully',
      });
    } catch (error) {
      console.error('Failed to add admin:', error);
      toast({
        title: 'Failed to add admin',
        description: 'Could not publish admin list to Nostr',
        variant: 'destructive',
      });
    }
  };

  const removeAdmin = async (pubkey: string) => {
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'You must be logged in to remove admins',
        variant: 'destructive',
      });
      return;
    }

    if (!isSiteOwner) {
      toast({
        title: 'Permission denied',
        description: 'Only the site owner can remove admins',
        variant: 'destructive',
      });
      return;
    }

    try {
      const events = await nostr.query([
        {
          kinds: [30078],
          authors: [SITE_OWNER_PUBKEY],
          '#d': [ADMIN_LIST_DTAG],
          limit: 1,
        },
      ]);

      let currentPubkeys: string[] = DEFAULT_ADMIN_PUBKEYS;
      if (events.length > 0) {
        const content = events[0].content;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentPubkeys = parsed.filter(
            (pk): pk is string => typeof pk === 'string' && /^[0-9a-fA-F]{64}$/.test(pk)
          );
        }
      }

      if (!currentPubkeys.some(pk => pk.toLowerCase() === pubkey.toLowerCase())) {
        toast({
          title: 'Admin not found',
          description: 'This pubkey is not in the admin list',
          variant: 'destructive',
        });
        return;
      }

      const newPubkeys = currentPubkeys.filter((pk) => pk !== pubkey);

      const event = await user.signer.signEvent({
        kind: 30078,
        content: JSON.stringify(newPubkeys),
        tags: [
          ['d', ADMIN_LIST_DTAG],
          ['alt', 'runngun.org admin list'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(event, { signal: AbortSignal.timeout(10000) });

      queryClient.invalidateQueries({ queryKey: ['admin-list'] });

      toast({
        title: 'Admin removed',
        description: 'Admin has been removed successfully',
      });
    } catch (error) {
      console.error('Failed to remove admin:', error);
      toast({
        title: 'Failed to remove admin',
        description: 'Could not publish admin list to Nostr',
        variant: 'destructive',
      });
    }
  };

  return { addAdmin, removeAdmin, isSiteOwner };
}
