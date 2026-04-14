import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { nip19 } from 'nostr-tools';

const RSS = () => {
  const { nostr } = useNostr();
  const navigate = useNavigate();
  const hasGenerated = useRef(false);

  useEffect(() => {
    if (hasGenerated.current) return;
    hasGenerated.current = true;

    const generateRSS = async () => {
      try {
        const now = Math.floor(Date.now() / 1000);
        const events = await nostr.query([
          { kinds: [31923], '#t': ['runngun', 'running', 'shooting', 'biathlon'], limit: 50 }
        ]);

        const upcoming = events
          .filter((ev) => {
            const start = parseInt(ev.tags.find(([k]) => k === 'start')?.[1] || '0');
            return start > now;
          })
          .sort((a, b) => {
            const startA = parseInt(a.tags.find(([k]) => k === 'start')?.[1] || '0');
            const startB = parseInt(b.tags.find(([k]) => k === 'start')?.[1] || '0');
            return startA - startB;
          });

        const siteUrl = 'https://runngun.org';
        const buildDate = new Date().toUTCString();

        const items = upcoming.map((ev) => {
          const d = ev.tags.find(([k]) => k === 'd')?.[1] || '';
          const title = ev.tags.find(([k]) => k === 'title')?.[1] || 'Untitled Event';
          const summary = ev.tags.find(([k]) => k === 'summary')?.[1] || '';
          const location = ev.tags.find(([k]) => k === 'location')?.[1] || '';
          const price = ev.tags.find(([k]) => k === 'price')?.[1] || '';
          const start = parseInt(ev.tags.find(([k]) => k === 'start')?.[1] || '0');

          const naddr = nip19.naddrEncode({
            kind: 31923,
            pubkey: ev.pubkey,
            identifier: d,
          });
          const link = `${siteUrl}/${naddr}`;
          const pubDate = new Date(start * 1000).toUTCString();

          let description = '';
          if (summary) description += `<p>${summary}</p>`;
          if (start) description += `<p><strong>Date:</strong> ${new Date(start * 1000).toLocaleDateString()}</p>`;
          if (location) description += `<p><strong>Location:</strong> ${escapeHtml(location)}</p>`;
          if (price) description += `<p><strong>Price:</strong> ${escapeHtml(price)}</p>`;

          return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>`;
        }).join('');

        const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>runngun.org - Upcoming Events</title>
    <link>${siteUrl}</link>
    <description>The official schedule for Run &amp; Gun two-gun biathlon competition events.</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

        const blob = new Blob([feed], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        window.location.href = url;
      } catch (err) {
        console.error('RSS generation error:', err);
        navigate('/');
      }
    };

    generateRSS();
  }, [nostr, navigate]);

  return (
    <div className="min-h-screen bg-background font-sans flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Generating RSS feed...</p>
      </div>
    </div>
  );
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default RSS;
