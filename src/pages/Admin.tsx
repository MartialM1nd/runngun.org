import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import {
  CalendarPlus,
  Calendar,
  Wifi,
  User,
  Pencil,
  Trash2,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
} from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { AdminGuard } from '@/components/AdminGuard';
import { RelayListManager } from '@/components/RelayListManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import { useCalendarEvents, splitEvents, type CalendarEvent } from '@/hooks/useCalendarEvents';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { ADMIN_PUBKEYS, getAllAdmins, addAdmin, removeAdmin } from '@/lib/admins';
import { EventForm, type FormState } from '@/components/EventForm';

const TEMPLATES_STORAGE_KEY = 'nostr:event-templates';

interface EventTemplate {
  id: string;
  name: string;
  form: FormState;
  createdAt: number;
}

function getTemplates(): EventTemplate[] {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates: EventTemplate[]): void {
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
}

// ─── Event Manager Tab ──────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function EventRow({
  calEvent,
  onEdit,
  onDeleted,
}: {
  calEvent: CalendarEvent;
  onEdit: (ev: CalendarEvent) => void;
  onDeleted: () => void;
}) {
  const { mutate: publishEvent, isPending: isDeleting } = useNostrPublish();
  const { toast } = useToast();
  const now = Math.floor(Date.now() / 1000);
  const effectiveEnd = calEvent.end ?? calEvent.start;
  const isPast = effectiveEnd < now;

  const naddr = nip19.naddrEncode({
    kind: 31923,
    pubkey: calEvent.event.pubkey,
    identifier: calEvent.d,
  });

  function handleDelete() {
    // Publish NIP-09 deletion request
    publishEvent(
      {
        kind: 5,
        content: 'Deleting calendar event',
        tags: [
          ['e', calEvent.event.id],
          ['a', `31923:${calEvent.event.pubkey}:${calEvent.d}`],
        ],
      },
      {
        onSuccess: () => {
          toast({ title: 'Event deleted', description: `"${calEvent.title}" has been deleted.` });
          onDeleted();
        },
        onError: () => {
          toast({
            title: 'Delete failed',
            description: 'Could not delete this event.',
            variant: 'destructive',
          });
        },
      },
    );
  }

  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
      isPast ? 'border-border bg-card/30 opacity-60' : 'border-border bg-card hover:border-primary/30'
    }`}>
      {/* Date badge */}
      <div className={`flex flex-col items-center justify-center min-w-[56px] rounded-md px-2 py-2 ${
        isPast ? 'bg-muted/30' : 'bg-primary/10'
      }`}>
        <span className={`font-condensed text-xs font-bold uppercase tracking-widest ${
          isPast ? 'text-muted-foreground' : 'text-primary'
        }`}>
          {new Date(calEvent.start * 1000).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
        </span>
        <span className={`font-condensed text-2xl font-bold leading-none ${
          isPast ? 'text-muted-foreground' : 'text-foreground'
        }`}>
          {new Date(calEvent.start * 1000).getDate()}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <h3 className="font-condensed text-base font-bold tracking-wide text-foreground truncate flex-1">
            {calEvent.title}
          </h3>
          {isPast && (
            <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground border-muted">
              Past
            </Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDate(calEvent.start)} · {formatTime(calEvent.start)}
            {calEvent.end && ` – ${formatTime(calEvent.end)}`}
          </span>
          {calEvent.location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {calEvent.location}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={() => onEdit(calEvent)}
          title="Edit event"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground hover:text-foreground text-xs font-condensed"
          asChild
          title="View event"
        >
          <Link to={`/${naddr}`} target="_blank">
            View
          </Link>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Delete event"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-condensed uppercase tracking-wide">
                Delete Event?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will publish a NIP-09 deletion request for{' '}
                <strong>&ldquo;{calEvent.title}&rdquo;</strong>. Relays may still retain the
                original event; deletion is best-effort on the Nostr network.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-condensed uppercase">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-condensed uppercase"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function EventsTab() {
  const queryClient = useQueryClient();
  const { data: events, isLoading } = useCalendarEvents();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const [showPast, setShowPast] = useState(false);
  const [templates, setTemplates] = useState<EventTemplate[]>(getTemplates);
  const [templateToLoad, setTemplateToLoad] = useState<Partial<FormState> | undefined>(undefined);

  const { upcoming, past } = events ? splitEvents(events) : { upcoming: [], past: [] };

  function handleEdit(ev: CalendarEvent) {
    setEditingEvent(ev);
    setTemplateToLoad(undefined);
    setShowForm(true);
  }

  function handleFormSuccess() {
    setShowForm(false);
    setEditingEvent(undefined);
    setTemplateToLoad(undefined);
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingEvent(undefined);
    setTemplateToLoad(undefined);
  }

  function handleDeleted() {
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
  }

  function handleSaveTemplate(name: string) {
    const newTemplate: EventTemplate = {
      id: crypto.randomUUID(),
      name,
      form: templateToLoad as FormState,
      createdAt: Math.floor(Date.now() / 1000),
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    saveTemplates(updated);
    toast({ title: 'Template saved', description: `"${name}" has been saved as a template.` });
  }

  function handleLoadTemplate(template: EventTemplate) {
    setTemplateToLoad(template.form);
    setShowForm(true);
  }

  function handleDeleteTemplate(id: string) {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
    toast({ title: 'Template deleted' });
  }

  return (
    <div className="space-y-6">
      {/* Templates section - show when not editing */}
      {!showForm && templates.length > 0 && (
        <div>
          <h3 className="font-condensed text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Templates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 p-3 rounded-md border border-border bg-muted/20"
              >
                <span className="flex-1 font-condensed text-sm font-bold truncate">{t.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadTemplate(t)}
                  className="font-condensed uppercase text-xs"
                >
                  Load
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTemplate(t.id)}
                  className="size-7 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <Separator className="mt-6" />
        </div>
      )}

      {/* Create / Edit form */}
      {showForm ? (
        <div className="rounded-lg border border-primary/30 bg-card p-5">
          <h2 className="font-condensed text-lg font-bold uppercase tracking-wide text-foreground mb-4 flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-primary" />
            {editingEvent ? 'Edit Event' : templateToLoad ? 'New Event (from template)' : 'New Event'}
          </h2>
          <EventForm
            existing={editingEvent}
            templateToLoad={templateToLoad}
            onSuccess={handleFormSuccess}
            onCancel={handleCancelForm}
            onSaveTemplate={handleSaveTemplate}
          />
        </div>
      ) : (
        <Button
          onClick={() => { setEditingEvent(undefined); setTemplateToLoad(undefined); setShowForm(true); }}
          className="font-condensed font-bold uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <CalendarPlus className="w-4 h-4 mr-2" />
          Create New Event
        </Button>
      )}

      <Separator />

      {/* Upcoming */}
      <div>
        <h3 className="font-condensed text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Upcoming ({upcoming.length})
        </h3>
        {isLoading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        )}
        {!isLoading && upcoming.length === 0 && (
          <p className="text-sm text-muted-foreground italic py-4">No upcoming events. Create one above.</p>
        )}
        {!isLoading && upcoming.length > 0 && (
          <div className="space-y-2">
            {upcoming.map((ev) => (
              <EventRow
                key={ev.event.id}
                calEvent={ev}
                onEdit={handleEdit}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past (collapsible) */}
      {!isLoading && past.length > 0 && (
        <div>
          <button
            onClick={() => setShowPast((s) => !s)}
            className="flex items-center gap-2 font-condensed text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPast ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Past Events ({past.length})
          </button>
          {showPast && (
            <div className="mt-3 space-y-2">
              {past.map((ev) => (
                <EventRow
                  key={ev.event.id}
                  calEvent={ev}
                  onEdit={handleEdit}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Relays Tab ─────────────────────────────────────────────────────────────

function RelaysTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-condensed text-lg font-bold uppercase tracking-wide text-foreground">
          Relay Configuration
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage which relays are used for reading and publishing events. Changes are published
          as NIP-65 relay list events when you are logged in.
        </p>
      </div>
      <Separator />
      <RelayListManager />
    </div>
  );
}

// ─── Identity Tab ────────────────────────────────────────────────────────────

function IdentityTab() {
  const { toast } = useToast();
  const [newAdminInput, setNewAdminInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  
  const allAdmins = getAllAdmins();
  const hardcodedCount = ADMIN_PUBKEYS.length;

  const handleAddAdmin = () => {
    const input = newAdminInput.trim();
    if (!input) return;

    let pubkey = input;
    try {
      const decoded = nip19.decode(input);
      if (decoded.type === 'npub') {
        pubkey = decoded.data;
      } else if (decoded.type === 'nprofile') {
        pubkey = decoded.data.pubkey;
      }
    } catch {
      // Assume it's a hex pubkey if decoding fails
    }

    if (!/^[0-9a-fA-F]{64}$/.test(pubkey)) {
      toast({
        title: 'Invalid pubkey',
        description: 'Please enter a valid npub or hex pubkey',
        variant: 'destructive',
      });
      return;
    }

    if (allAdmins.some(pk => pk.toLowerCase() === pubkey.toLowerCase())) {
      toast({
        title: 'Admin already exists',
        description: 'This pubkey is already an admin',
        variant: 'destructive',
      });
      return;
    }

    addAdmin(pubkey);
    setNewAdminInput('');
    setIsAdding(false);
    toast({
      title: 'Admin added',
      description: 'New admin has been added successfully',
    });
  };

  const handleRemoveAdmin = (pubkey: string) => {
    removeAdmin(pubkey);
    toast({
      title: 'Admin removed',
      description: 'Admin has been removed successfully',
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-condensed text-lg font-bold uppercase tracking-wide text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Admin Accounts
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage admin access for this site. Hardcoded admins cannot be removed.
        </p>

        {isAdding ? (
          <div className="flex gap-2">
            <Input
              placeholder="Enter npub or hex pubkey"
              value={newAdminInput}
              onChange={(e) => setNewAdminInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddAdmin()}
              className="font-mono text-sm"
            />
            <Button onClick={handleAddAdmin} size="sm">
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setIsAdding(false); setNewAdminInput(''); }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="font-condensed uppercase"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        )}

        <div className="space-y-2">
          {allAdmins.map((pk, i) => {
            let npub = pk;
            try {
              npub = nip19.npubEncode(pk);
            } catch {
              // keep as hex if encoding fails
            }
            const isHardcoded = i < hardcodedCount;
            return (
              <div
                key={pk}
                className="flex items-center gap-3 rounded-md border border-border bg-muted/20 px-3 py-2"
              >
                <Badge variant="outline" className="text-xs shrink-0 font-condensed">
                  {isHardcoded ? (i === 0 ? 'Owner' : 'Hardcoded') : 'Admin'}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground truncate flex-1">
                  {npub}
                </span>
                {!isHardcoded && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveAdmin(pk)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Admin Page ──────────────────────────────────────────────────────────────

export default function Admin() {
  useSeoMeta({
    title: 'Admin — runngun.org',
    description: 'Manage Run & Gun events, relays, and identity.',
  });

  return (
    <AdminGuard>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-condensed text-4xl font-bold uppercase tracking-wide text-foreground">
            Event Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage events, relays, and your Nostr identity for runngun.org.
          </p>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="w-full mb-6 h-auto p-1 bg-muted/30 border border-border rounded-lg grid grid-cols-3">
            <TabsTrigger
              value="events"
              className="font-condensed font-bold uppercase tracking-wide text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5"
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              Events
            </TabsTrigger>
            <TabsTrigger
              value="relays"
              className="font-condensed font-bold uppercase tracking-wide text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5"
            >
              <Wifi className="w-4 h-4 mr-1.5" />
              Relays
            </TabsTrigger>
            <TabsTrigger
              value="identity"
              className="font-condensed font-bold uppercase tracking-wide text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5"
            >
              <User className="w-4 h-4 mr-1.5" />
              Identity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-0">
            <EventsTab />
          </TabsContent>

          <TabsContent value="relays" className="mt-0">
            <RelaysTab />
          </TabsContent>

          <TabsContent value="identity" className="mt-0">
            <IdentityTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminGuard>
  );
}
