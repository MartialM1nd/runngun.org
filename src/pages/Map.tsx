import { useEffect, useRef, useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
} from 'maplibre-gl';

import { useScheduleEvents } from '@/hooks/useScheduleEvents';
import {
  formatScheduleEventDate,
  getScheduleEventState,
  scheduleEventNaddr,
  type ScheduleEvent,
} from '@/lib/schedule-event';
import { useLocationResolutions } from '@/hooks/useLocationResolutions';
import { normalizeLocation, type LocationResolution } from '@/lib/location-resolution';
import { Button } from '@/components/ui/button';

const CARTO_API_KEY = import.meta.env.VITE_CARTO_BASEMAP_API_KEY?.trim();

function createMarkerElement(isPast: boolean, title: string): HTMLButtonElement {
  const marker = document.createElement('button');
  marker.type = 'button';
  marker.className = `event-map-marker ${isPast ? 'event-map-marker-past' : 'event-map-marker-upcoming'}`;
  marker.title = title;
  marker.setAttribute('aria-label', `View ${title}`);
  return marker;
}

function buildPopupContent(calEvent: ScheduleEvent, resolution: LocationResolution): string {
  const naddr = scheduleEventNaddr(calEvent);

  const dateStr = formatScheduleEventDate(calEvent, { weekday: undefined });

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/`/g, '&#96;');

  return `
    <div style="background: #1a1a1a; color: #e5e5e5; border: none; box-shadow: none;">
      <a href="/${naddr}" style="font-weight: bold; font-size: 14px; color: #fff; text-decoration: none;">
        ${escapeHtml(calEvent.title)}
      </a>
      <div style="font-size: 12px; color: #999; margin-top: 4px;">${dateStr}</div>
      ${calEvent.location ? `<div style="font-size: 12px; color: #999; margin-top: 4px;">${escapeHtml(calEvent.location)}</div>` : ''}
      ${resolution.precision === 'approximate' ? '<div style="font-size: 11px; color: #dc5522; margin-top: 4px;">Approximate location</div>' : ''}
      <a href="/${naddr}" style="font-size: 12px; color: #dc5522; text-decoration: none; margin-top: 8px; display: block;">
        View Details →
      </a>
    </div>
  `;
}

interface MapViewProps {
  events: ScheduleEvent[];
  locations: Record<string, LocationResolution>;
}

function MapView({ events, locations }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!CARTO_API_KEY || !mapContainerRef.current || mapRef.current) return;

    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: mapContainerRef.current,
        style: `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json?key=${encodeURIComponent(CARTO_API_KEY)}`,
        center: [-98.5795, 39.8283],
        zoom: 4,
        attributionControl: { compact: true },
      });
      map.addControl(new NavigationControl(), 'top-left');
      map.on('error', () => {
        if (!map.isStyleLoaded()) {
          setMapError('The vector basemap could not be loaded. Check the CARTO API key and network connection.');
        }
      });
      mapRef.current = map;
    } catch (error) {
      console.error('Failed to initialize event map:', error);
      setMapError('This browser could not initialize the vector map. WebGL may be unavailable.');
      return;
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const validLocations: [number, number][] = [];

    // Count how many events land on each coordinate so we can spread duplicates
    const coordCount: Record<string, number> = {};
    const coordIndex: Record<string, number> = {};

    events.forEach((ev) => {
      if (!ev.location) return;
      const cacheKey = normalizeLocation(ev.location);
      const loc = locations[cacheKey];
      if (!loc) return;
      const key = `${loc.lat},${loc.lng}`;
      coordCount[key] = (coordCount[key] ?? 0) + 1;
    });

    const OFFSET = 0.018; // degrees (~1.5km) — enough to visually separate at zoom 4-8

    events.forEach((ev) => {
      if (!ev.location) return;
      const cacheKey = normalizeLocation(ev.location);
      const loc = locations[cacheKey];
      if (!loc) return;

      const key = `${loc.lat},${loc.lng}`;
      const total = coordCount[key] ?? 1;
      const idx = coordIndex[key] ?? 0;
      coordIndex[key] = idx + 1;

      // Arrange duplicates in a small circle around the true point
      let lat = loc.lat;
      let lng = loc.lng;
      if (total > 1) {
        const angle = (2 * Math.PI * idx) / total;
        lat = loc.lat + OFFSET * Math.sin(angle);
        lng = loc.lng + OFFSET * Math.cos(angle);
      }

      validLocations.push([lng, lat]);

      const isPast = getScheduleEventState(ev) === 'past';
      const marker = new Marker({
        element: createMarkerElement(isPast, ev.title),
        anchor: 'center',
      })
        .setLngLat([lng, lat])
        .setPopup(
          new Popup({ className: 'event-map-popup', offset: 12 })
            .setHTML(buildPopupContent(ev, loc)),
        )
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (validLocations.length > 0) {
      const bounds = new LngLatBounds();
      validLocations.forEach((coordinates) => bounds.extend(coordinates));
      map.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [events, locations]);

  const error = !CARTO_API_KEY
    ? 'The event map is not configured. Set VITE_CARTO_BASEMAP_API_KEY when building the site.'
    : mapError;

  return (
    <div className="absolute inset-0 bg-[hsl(220_15%_8%)]">
      <div ref={mapContainerRef} className="absolute inset-0" />
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 px-6">
          <div role="alert" className="max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-xl">
            <p className="font-condensed text-lg font-bold uppercase tracking-wide text-foreground">Map unavailable</p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  useSeoMeta({
    title: 'Map — runngun.org',
    description: 'View all Run & Gun events on an interactive map.',
  });

  const { data: events, isLoading: eventsLoading } = useScheduleEvents();
  const allEvents = events ?? [];
  const eventsWithLocation = allEvents.filter((ev) => ev.location);
  const { data: locations = {}, isLoading: locationsLoading } = useLocationResolutions(
    eventsWithLocation.flatMap((event) => event.location ? [event.location] : []),
  );

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <header className="relative isolate overflow-hidden border-b border-border shrink-0">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(220_20%_5%)] via-[hsl(220_15%_8%)] to-[hsl(28_30%_8%)]" />
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/40 bg-primary/10 hover:bg-primary/20 transition-colors">
                <img src="/logo-vector-circle.png" alt="Run & Gun" className="w-10 h-10 object-contain" />
              </Link>
              <div>
                <h1 className="font-condensed text-2xl font-bold uppercase tracking-wide text-foreground">
                  EVENT MAP
                </h1>
                <p className="text-sm text-muted-foreground">Interactive map of events</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/schedule">
                <Button variant="ghost" size="sm" className="font-condensed uppercase">Schedule</Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" size="sm" className="font-condensed uppercase">Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        <MapView events={eventsWithLocation} locations={locations} />

        {(eventsLoading || locationsLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[1000]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Resolving event locations...</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 z-[1000]">
          <div className="text-xs font-condensed font-bold uppercase text-muted-foreground mb-2">Legend</div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Upcoming</span>
          </div>
          <div className="flex items-center gap-2 text-xs mt-1">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <span>Past</span>
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 z-[1000]">
          <div className="text-xs font-condensed font-bold">{eventsWithLocation.length} events with locations</div>
        </div>
      </main>

      <footer className="border-t border-border py-4 shrink-0">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/logo-vector-circle.png" alt="Run & Gun" className="w-6 h-6 object-contain" />
            <span className="font-condensed font-bold tracking-wide uppercase text-foreground">runngun.org</span>
          </div>
          <Link to="/admin" className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <span className="text-xs">Admin</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
