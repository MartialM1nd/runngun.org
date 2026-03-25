import { type ReactNode } from 'react';
import { Shield, ShieldOff, Target } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isAdmin } from '@/lib/admins';
import { LoginArea } from '@/components/auth/LoginArea';

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * AdminGuard — wraps admin-only content behind Nostr authentication.
 *
 * Shows a login prompt if not logged in, and an "unauthorized" message
 * if the logged-in pubkey is not in the ADMIN_PUBKEYS list.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { user } = useCurrentUser();

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-6">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-primary/40 bg-primary/10 mx-auto">
            <Shield className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide text-foreground">
              Admin Access
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in with your Nostr identity to manage Run &amp; Gun events.
            </p>
          </div>

          <div className="flex justify-center">
            <LoginArea className="w-full" />
          </div>

          <p className="text-xs text-muted-foreground">
            Access is restricted to authorized admin accounts only.
          </p>
        </div>
      </div>
    );
  }

  // Logged in but not an admin
  if (!isAdmin(user.pubkey)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-destructive/40 bg-destructive/10 mx-auto">
            <ShieldOff className="w-8 h-8 text-destructive" />
          </div>

          <div>
            <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide text-foreground">
              Access Denied
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your Nostr account is not authorized to access the admin panel.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60 font-mono break-all">
              {user.pubkey}
            </p>
          </div>

          <div className="flex justify-center">
            <LoginArea className="w-full" />
          </div>

          <p className="text-xs text-muted-foreground">
            Contact the site owner to request admin access.
          </p>
        </div>
      </div>
    );
  }

  // Authorized — render children
  return (
    <div className="min-h-screen bg-background">
      {/* Admin header bar */}
      <div className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-primary shrink-0" />
            <span className="font-condensed text-lg font-bold uppercase tracking-wide text-foreground">
              Run &amp; Gun
            </span>
            <span className="text-muted-foreground/40 hidden sm:inline">·</span>
            <span className="font-condensed text-sm uppercase tracking-widest text-primary hidden sm:inline">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LoginArea className="max-w-48" />
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
