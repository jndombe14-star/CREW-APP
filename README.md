# CREW

Marketplace de services professionnels + réseau de collaborations créatives.

Real auth, a real Postgres+PostGIS database, and both universes (Espace PRO / Espace COLLAB)
working end-to-end: profiles, discovery, geolocation, messaging, bookings, collaborations, and
reviews. See "What's not built yet" below for what's intentionally left out and why.

## Stack

- **App**: Expo (React Native + TypeScript) + Expo Router
- **Backend**: Supabase (Postgres + PostGIS + Auth + Realtime)
- **State**: Zustand (client state) + TanStack Query (server state)

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env` and fill in your project's URL and anon/publishable key
   (Project Settings → API):
   ```bash
   cp .env.example .env
   ```
3. Apply the database migrations, in order, to your Supabase project — via the SQL editor
   (paste and run each file in `supabase/migrations/`, in numeric order, then optionally
   `supabase/seed.sql` for demo categories), or via the Supabase CLI:
   ```bash
   supabase db push
   ```
4. Install dependencies and start the app:
   ```bash
   npm install
   npm run ios   # or: npm run android / npm run web
   ```
5. (Optional) To access `/admin` (view reports, platform stats), grant your own account admin
   rights via the SQL editor — there is no in-app way to do this, by design:
   ```sql
   update profiles set is_admin = true where username = 'your_username';
   ```

## What works end-to-end

- **Auth & onboarding**: register/login (Supabase Auth), choose PRO / COLLAB / both, minimal
  profile setup for each, both skippable and completable later from Profil → Modifier.
- **Discovery**: Explorer lists real professionals, creators, and open collaboration projects
  from the database; "Près de moi" does real PostGIS proximity search (`nearby_professionals`/
  `nearby_creators` RPCs) once a profile has a location set.
- **Geolocation**: "Utiliser ma position actuelle" in profile editing captures device GPS,
  reverse-geocodes to a city, and stores a real PostGIS point.
- **Profile detail pages**: public PRO/COLLAB profile views with services, rating, and reviews.
- **Messaging**: real conversations with Supabase Realtime (not polling) — start a conversation
  from any profile, list conversations, send/receive messages live.
- **Bookings (PRO flow)**: request a service with date/time/location → professional
  accepts/declines → marks completed → client leaves a review. Full status lifecycle enforced
  server-side via RLS, not the client.
- **Collaborations (COLLAB flow)**: publish a project (type, category, date, location, budget) →
  others apply → creator accepts an applicant (auto-opens a conversation) → track via "Mes
  collaborations".
- **Reviews**: tied to a real completed interaction (spec §30's rule — never a free-floating
  rating) — either a completed booking (client reviews the pro) or a completed collaboration
  (creator and matched applicant can each review the other). Publicly readable, aggregated into
  a per-profile average shown on PRO profiles.
- **Trust & Safety**: report and block, from any profile page. Blocking has real effect — RLS
  hides blocked profiles from each other everywhere (Explorer, proximity search) and prevents
  starting new conversations between blocked pairs, enforced in Postgres, not just hidden in the UI.
- **Favorites**: save a PRO/COLLAB profile or a collaboration project from its detail page,
  find them again under Profil → Mes favoris.
- **Portfolio & avatar photos/videos**: real photo *and video* upload to Supabase Storage
  (`expo-video` playback, muted looping thumbnails) — change your avatar or add portfolio media
  to a PRO profile, shown on the public profile page.
- **Visual map**: `react-native-maps` (works in Expo Go, no extra setup for dev) showing real
  PRO (blue) and COLLAB (pink) pins from the same PostGIS proximity search, tap a pin to open
  the profile. Production app-store builds need a Google Maps API key (not required for dev).
- **Category filters & relevance sort**: Explorer can be filtered by profession/interest
  category (PRO and COLLAB, including in "Près de moi" mode), and PRO results can be sorted by
  "Pertinence" — a real weighted score (rating, review volume, service completeness, distance
  when available), in the spirit of spec §20 but honestly scoped to the signals the app
  actually has (no captured search intent like skills/budget yet — see below).
- **Notifications**: a real notification center, populated by Postgres triggers (not client-side
  fakes) on new booking requests, booking status changes, new collaboration applications,
  application status changes, and new messages — delivered live via Realtime, with an unread
  badge on Home. Each notification also fires a real push via `pg_net` calling Expo's push API
  directly from Postgres (verified: the HTTP call reaches Expo's servers and gets a real
  response) — but **actually receiving a push on a device needs an EAS project** (`eas init`,
  your own Expo account) so the app can get a real push token; without one, push registration
  no-ops safely and the in-app/Realtime notification center still works.
- **Admin panel**: `/admin` (gated by `profiles.is_admin`, set via SQL only) shows platform
  stats and every report filed, so Trust & Safety data actually goes somewhere.
- **Availability**: a PRO sets real weekly working hours and specific blocked dates; a client
  requesting a booking sees an inline warning if the chosen date falls outside those hours or
  on a blocked date (not a hard block — the request can still be sent, matching the spec's
  "surface availability" approach rather than a full slot-conflict engine).

Row Level Security is enforced on every table: the client is never trusted for ownership,
status transitions, or who-can-see-what — the database checks `auth.uid()` itself.

## What's NOT built yet

Deliberate omissions — per the product spec's own rule against faking functionality:

| Feature | Status | Needed before building |
|---|---|---|
| Payments / Stripe Connect | Not started | Stripe account + secret key |
| Social OAuth (Instagram/TikTok/FB/X/YouTube) | Not started | Developer app registration on each platform |
| Actually receiving push notifications | Backend verified, device delivery pending | `eas init` with your own Expo account (see Notifications above) |
| Full matching engine with search intent | Partial (real relevance sort, no skills/budget parsing) | A "what/when/where" search parser (spec §18/§19) to capture real intent to score against |
| Push notifications | Not started | Expo push tokens + a delivery trigger |

## Project structure

```
app/                 Expo Router screens (file-based routing)
  (auth)/            Welcome, login, register
  onboarding/         Mode selection + first profile setup
  (tabs)/             Home, Explore, Map (stub), Messages, Profile
  profile-edit/        Edit personal/pro/collab info post-onboarding
  pro/, collab/         Public profile detail pages
  chat/                 Conversation thread
  bookings/             My bookings (received/sent, accept/decline, reviews)
  collaborations/       Create / view / apply / my collaborations
  favorites/             Saved profiles and collaboration projects
src/components/      Reusable UI primitives (Button, Card, Input, Badge, Avatar, EmptyState, Screen)
src/features/        Feature-scoped hooks (one folder per domain)
src/lib/             Supabase client, query client, hand-written DB types, location helper
src/store/           Zustand stores (auth)
src/theme/           Design tokens (colors, spacing, radius, typography)
supabase/            SQL migrations (numbered, apply in order) + dev seed data
```
