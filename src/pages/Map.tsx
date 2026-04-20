import { useState, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import { useCalendarEvents, splitEvents, type CalendarEvent } from '@/hooks/useCalendarEvents';
import { Button } from '@/components/ui/button';

interface GeocodedLocation {
  lat: number;
  lng: number;
  label: string;
}

const GEOCODE_CACHE_KEY = 'runngun:location-cache';

function getGeocodeCache(): Record<string, GeocodedLocation> {
  try {
    const cached = localStorage.getItem(GEOCODE_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

function setGeocodeCache(cache: Record<string, GeocodedLocation>) {
  try {
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

async function geocodeLocation(location: string): Promise<GeocodedLocation | null> {
  const cache = getGeocodeCache();
  const cacheKey = location.toLowerCase().trim();

  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    // Rate limited to 1 req/sec
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.length === 0) return null;

    const result: GeocodedLocation = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      label: data[0].display_name,
    };

    cache[cacheKey] = result;
    setGeocodeCache(cache);

    return result;
  } catch {
    return null;
  }
}

function EventMarker({ calEvent, geocodedLocation }: { calEvent: CalendarEvent; geocodedLocation: GeocodedLocation | null }) {
  const now = Math.floor(Date.now() / 1000);
  const effectiveEnd = calEvent.end ?? calEvent.start;
  const isPast = effectiveEnd < now;

  const naddr = nip19.naddrEncode({
    kind: 31923,
    pubkey: calEvent.event.pubkey,
    identifier: calEvent.d,
  });

  const dateStr = new Date(calEvent.start * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const markerIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${isPast ? '#6b7280' : '#dc5522'};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  if (!geocodedLocation) return null;

  return (
    <Marker position={[geocodedLocation.lat, geocodedLocation.lng]} icon={markerIcon}>
      <Popup>
        <div className="max-w-xs">
          <Link to={`/${naddr}`} className="font-condensed font-bold text-sm text-foreground hover:text-primary">
            {calEvent.title}
          </Link>
          <div className="text-xs text-muted-foreground mt-1">
            {dateStr}
          </div>
          {calEvent.location && (
            <div className="text-xs text-muted-foreground mt-1">
              {calEvent.location}
            </div>
          )}
          <Link
            to={`/${naddr}`}
            className="text-xs text-primary hover:underline mt-2 block"
          >
            View Details →
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapPage() {
  useSeoMeta({
    title: 'Map — runngun.org',
    description: 'View all Run & Gun events on an interactive map.',
  });

  const { data: events, isLoading: eventsLoading } = useCalendarEvents();
  const [locations, setLocations] = useState<Record<string, GeocodedLocation>>({});
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [progress, setProgress] = useState(0);

  const { upcoming, past } = events ? splitEvents(events) : { upcoming: [], past: [] };
  const allEvents = [...upcoming, ...past];
  const eventsWithLocation = allEvents.filter((ev) => ev.location);

  const uniqueLocations = [...new Set(eventsWithLocation.map((ev) => ev.location!.toLowerCase().trim()))];

  useEffect(() => {
    if (!uniqueLocations.length) return;

    const cache = getGeocodeCache();

    // Check which locations need geocoding
    const needGeocoding = uniqueLocations.filter((loc) => !cache[loc]);

    if (needGeocoding.length === 0) {
      setLocations(cache);
      return;
    }

    setIsGeocoding(true);
    setProgress(0);

    const geocodeAll = async () => {
      for (let i = 0; i < needGeocoding.length; i++) {
        const loc = needGeocoding[i];
        setProgress(((i + 1) / needGeocoding.length) * 100);

        // Find the original location string
        const originalLocation = eventsWithLocation.find(
          (ev) => ev.location!.toLowerCase().trim() === loc
        )?.location;

        if (originalLocation) {
          await geocodeLocation(originalLocation);
        }
      }

      setLocations(getGeocodeCache());
      setIsGeocoding(false);
    };

    geocodeAll();
  }, [uniqueLocations.length]);

  const center: [number, number] = [39.8283, -98.5795];

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {/* Header */}
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
                <p className="text-sm text-muted-foreground">
                  Interactive map of events
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/schedule">
                <Button variant="ghost" size="sm" className="font-condensed uppercase">
                  Schedule
                </Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" size="sm" className="font-condensed uppercase">
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Map */}
      <main className="flex-1 relative">
        {eventsLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-[1000]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          </div>
        ) : isGeocoding ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-[1000]">
            <div className="text-center w-64">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Geocoding locations...</p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{Math.round(progress)}%</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={4}
            className="absolute inset-0"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {eventsWithLocation.map((ev) => {
              const cacheKey = ev.location!.toLowerCase().trim();
              const geocoded = locations[cacheKey];
              return <EventMarker key={ev.d} calEvent={ev} geocodedLocation={geocoded} />;
            })}
          </MapContainer>
        )}

        {/* Legend */}
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

        {/* Event count */}
        <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 z-[1000]">
          <div className="text-xs font-condensed font-bold">
            {eventsWithLocation.length} events with locations
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 shrink-0">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/logo-vector-circle.png" alt="Run & Gun" className="w-6 h-6 object-contain" />
            <span className="font-condensed font-bold tracking-wide uppercase text-foreground">
              runngun.org
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <span className="text-xs">Admin</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}