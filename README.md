# Run & Gun

A Nostr-powered event calendar for shooting sports and multi-sport events (running, shooting, biathlon).

## Overview

Run & Gun is a decentralized event calendar built on the Nostr protocol. Events are stored as NIP-52 calendar events on Nostr relays, allowing for a censorship-resistant, open-source alternative to traditional event management platforms.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **shadcn/ui** - UI component library
- **Nostrify** - Nostr protocol integration
- **TanStack Query** - Data fetching and caching

## Key Features

### Event Management
- Create, edit, and delete calendar events (NIP-52 kind 31923)
- Event templates saved to Nostr (NIP-78 kind 30078)
- Auto-set end date for weekend events (Saturday/Sunday → next day 5pm)
- Automatic tags: `runngun`, `running`, `shooting`, `biathlon`

### Nostr Integration
- **Authentication**: NIP-07 signer extension (Alby, nos2x, etc.)
- **Events**: Kind 31923 (time-based calendar events)
- **RSVP**: Kind 31925 (event RSVPs)
- **Comments**: Kind 1 text notes threaded to events
- **Zaps**: LNURL lightning payments (NIP-57)
- **Direct Messages**: NIP-04 encrypted DMs

### Admin System
- Admin list stored on Nostr (NIP-78 kind 30078, d-tag: `runngun-admin-list`)
- Only the site owner can modify the admin list
- Event templates stored on Nostr (any admin can modify)
- Admin-only pages for event management

### Media Storage
- Blossom server integration for image uploads
- NIP-98 compliant media tags

## Project Structure

```
src/
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── auth/        # Login, signup, account switching
│   ├── dm/          # Direct messaging (NIP-04)
│   └── comments/    # Comment system
├── contexts/        # React context providers
├── hooks/           # Custom hooks
│   ├── useAdminList.ts
│   ├── useAdminMutations.ts
│   ├── useTemplateList.ts
│   ├── useTemplateMutations.ts
│   └── ...
├── lib/             # Utilities
│   ├── config.ts    # Site configuration
│   └── admins.ts    # Admin utilities
└── pages/           # Route pages
    ├── Admin.tsx    # Admin panel
    ├── Calendar.tsx # Calendar view
    ├── Schedule.tsx # Schedule view
    └── ...
```

## Configuration

### Site Owner
The site owner pubkey is defined in `src/lib/config.ts`:
```typescript
export const SITE_OWNER_PUBKEY = '1f273472730e3369aa7888e81203598e0330064264fb950c31958fe08f1ce596';
```

### Nostr Storage

| Data Type | NIP | Kind | d-tag |
|-----------|-----|------|-------|
| Admin list | 78 | 30078 | `runngun-admin-list` |
| Templates | 78 | 30078 | `runngun-event-templates` |
| Events | 52 | 31923 | Event-specific |
| RSVPs | 52 | 31925 | Event-specific |

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Deployment

1. Build the project: `npm run build`
2. Copy `dist/` folder to web server (nginx, etc.)
3. Configure nginx to serve static files and handle SPA routing

### nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name runngun.org;
    root /opt/runngun.org/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Security

- All admin queries filter by author pubkey to prevent spoofing
- Admin list modifications restricted to site owner only
- Template modifications available to any admin
- Content Security Policy headers configured in nginx

## License

ISC
