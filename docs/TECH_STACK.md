# Tech Stack & Architecture (MVP)

## Core Stack
- Framework: Expo (Managed) + Expo Router (file-based routing)
- Language: TypeScript
- UI: NativeWind (Tailwind for RN)
- Animation: Moti + React Native Reanimated
- Backend: Supabase (Auth, Postgres, Storage)
- Icons: Lucide React Native

## Config / Env
- `.env` (Expo reads EXPO_PUBLIC_*):
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Deep link scheme: `coupleadvent://share/<code>`

## Routes (current)
- `/auth`: Magic link (creator)
- `/pair`: Pairing/relationship setup (creator path)
- `/creator`: Edit menu + share link button + total days switch
- `/creator/edit/[day]`: Door editing (text/image/youtube)
- `/calendar`: Calendar view (JST unlock; uses relationship.total_days)
- `/door/[day]`: Content view
- `/share/[code]`: Receiver entry; anonymous auth + claim link → calendar

## Data Model (key tables)
- `relationships`: id, invite_code, created_by, total_days
- `relationship_members`: relationship_id, user_id, role
- `advent_entries`: relationship_id, day, type(text/image/youtube), text_content, image_path, youtube_url
- `share_links`: relationship_id, code, claimed_by, expires_at, disabled

## Security (RLS)
- Members can read entries; creators can write.
- Receivers (claimed_by) can read entries + storage by relationship.
- Storage: private bucket `advent-media`, reads via signed URL only.

## Auth Modes
- Creator: Email magic link (later Apple/Google); writes content.
- Receiver: Anonymous sign-in automatically when opening share link; read-only.

## Future Enhancements
- Content: `video`, `link` types; gift card UI; OG previews.
- Security: passcode-protected share, device bind, audit/open logs.
- Polish: richer door animations, particles, sound.

