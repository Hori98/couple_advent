Couple Advent (Expo + Supabase)

## Concept & Stack
- Concept: see `docs/CONCEPT.md`
- Stack/Architecture: see `docs/TECH_STACK.md`

## Prerequisites
- Node 18+
- iOS: Xcode + Simulator (or Expo Go on device)
- Android: Android Studio + Emulator (or Expo Go on device)

## Setup
1) Copy `.env.example` to `.env` and set:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
2) Install deps:
   - `npm install` (or `yarn`)
3) Start the dev server:
   - `npx expo start` (recommended)
   - If you prefer global CLI: `npm i -g expo` then `expo start`

## Run on Simulators
- iOS Simulator: press `i` in the Expo dev terminal
- Android Emulator: press `a`
- Web: press `w` (limited)

## First Run: Supabase Setup (done once)
1) Apply SQL in `supabase/schema.sql` (tables, RLS, RPC)
2) Add the share link SQL (see conversation or extend from schema)
3) Create private Storage bucket `advent-media`
4) Auth Providers: enable Email (magic link) + Anonymous

## Test Flow
1) Creator: open `/auth` → sign in → `/pair` → `/creator`
2) Set total days (14/24/30), add content for some days
3) Tap “共有リンクを発行してシェア” → send the deep link
4) Receiver: open the link → `/share/[code]` claims → `/calendar`
5) Tap a door: content appears; images use signed URLs

## Notes
- Storage uploads attach metadata `{ relationship_id, day }` for RLS.
- JST unlock and carryover handled client-side for MVP.
