import { useSeoMeta } from '@unhead/react';
import { Target, ChevronDown, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCalendarEvents, splitEvents } from '@/hooks/useCalendarEvents';
import { EventCard, EventCardSkeleton } from '@/components/EventCard';
import { Button } from '@/components/ui/button';

const Index = () => {
  useSeoMeta({
    title: 'Run & Gun — Two-Gun Biathlon Events',
    description:
      'The official schedule for Run & Gun two-gun biathlon competition events. Race hard, shoot straight.',
  });

  const { data: events, isLoading, isError } = useCalendarEvents();
  const { upcoming, past } = events ? splitEvents(events) : { upcoming: [], past: [] };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* ── Hero ────────────────────────────────────────────────── */}
      <header className="relative isolate overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(220_20%_5%)] via-[hsl(220_15%_8%)] to-[hsl(28_30%_8%)]" />
        <div className="absolute inset-0 -z-10 scanlines" />
        {/* Amber glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 -z-10 w-[600px] h-[400px] rounded-full bg-primary/8 blur-[80px]" />
        {/* Grid texture */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(32 95% 52% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(32 95% 52% / 0.3) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="container mx-auto px-4 py-20 sm:py-28 text-center">
          {/* Icon badge */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-primary/40 bg-primary/10 mb-6 animate-fade-in">
            <Target className="w-8 h-8 text-primary" />
          </div>

          {/* Wordmark */}
          <h1 className="font-condensed text-6xl sm:text-8xl font-bold tracking-tight text-foreground uppercase animate-fade-in-up">
            Run &amp; Gun
          </h1>
          <div className="mt-2 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

          <p className="mt-5 font-condensed text-xl sm:text-2xl text-primary uppercase tracking-[0.25em] font-600 animate-fade-in-up">
            Two-Gun Biathlon Events
          </p>

          <p className="mt-4 max-w-xl mx-auto text-muted-foreground text-base sm:text-lg leading-relaxed animate-fade-in">
            Race hard. Shoot straight. Compete in the most demanding multi-discipline shooting
            sport — combining pistol and rifle marksmanship with a timed run course.
          </p>

          {/* CTA row */}
          <div className="mt-8 flex flex-wrap gap-3 items-center justify-center animate-fade-in">
            <Button
              size="lg"
              className="font-condensed text-lg font-bold tracking-wide uppercase bg-primary text-primary-foreground hover:bg-primary/90 px-8"
              onClick={() => {
                document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              View Schedule
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="font-condensed text-lg font-bold tracking-wide uppercase border-border text-foreground hover:border-primary/60 hover:text-primary px-8"
              asChild
            >
              <Link to="/admin">Admin</Link>
            </Button>
          </div>

          {/* Scroll hint */}
          <div className="mt-14 flex justify-center animate-pulse-amber">
            <ChevronDown className="w-5 h-5 text-primary/50" />
          </div>
        </div>
      </header>

      {/* ── Event Schedule ──────────────────────────────────────── */}
      <main id="events" className="container mx-auto px-4 py-12 max-w-3xl">

        {/* Upcoming Events */}
        <section>
          <SectionHeader label="Upcoming Events" accent />

          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && (
            <EmptyState message="Could not load events. Check your relay connections." />
          )}

          {!isLoading && !isError && upcoming.length === 0 && (
            <EmptyState message="No upcoming events scheduled. Check back soon!" />
          )}

          {!isLoading && !isError && upcoming.length > 0 && (
            <div className="space-y-3">
              {upcoming.map((ev) => (
                <EventCard key={ev.event.id} calEvent={ev} />
              ))}
            </div>
          )}
        </section>

        {/* Past Events */}
        {!isLoading && past.length > 0 && (
          <section className="mt-14">
            <SectionHeader label="Past Events" />
            <div className="space-y-3">
              {past.map((ev) => (
                <EventCard key={ev.event.id} calEvent={ev} isPast />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-condensed font-bold tracking-wide uppercase text-foreground">
              Run &amp; Gun
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span>runngun.org</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <a
              href="https://shakespeare.diy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Vibed with Shakespeare
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

function SectionHeader({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {accent && <div className="w-1 h-6 bg-primary rounded-full shrink-0" />}
      <h2 className={`
        font-condensed text-2xl font-bold uppercase tracking-wide
        ${accent ? 'text-foreground' : 'text-muted-foreground'}
      `}>
        {label}
      </h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/30 py-12 px-8 text-center">
      <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

export default Index;
