# Couple Advent — Plan v1.1 (Creator-first, Lightweight)

## Purpose
- Cute, intuitive advent calendar for couples with a delightful door-opening moment.
- Ship a lightweight, demoable “full-view grid + open animation” first; refine visuals and content later.

## Scope (MVP – Creator first)
- Creator flow only (Receiver/anonymous later).
- Minimal settings: title + days (14/24/30).
- Content types (mock-first): text, image, link (video next).
- Share link with optional passcode. Receiver UX later.

## User Flow (Creator)
- Onboarding → Auth (email + 6‑digit OTP) → Setup (title + days) → Creator Calendar (grid) → Edit Day → Share link
- Return visits jump directly to Creator Calendar.

## Screens & Routes
- `/(public)/onboarding`: concept + CTA → `/auth`.
- `/(public)/auth`: email + OTP (dev: anonymous button optional).
- `/(creator)/setup`: title + days; creates relationship; sets `total_days`.
- `/(creator)/calendar`: full-view grid; edit/preview; CTA → share.
- `/(creator)/edit/[day]`: text/image/link (mock-capable); save.
- `/(creator)/share`: create link, optional passcode, copy/share.

## Lightweight Build (no heavy assets first)
- Background: gradient (night) + simple dots (snow) → later swap to image.
- Doors: rounded cards with gold-ish stroke via styles → later swap to PNG frames.
- Animations: Moti + Reanimated (scale + rotateY) for open; locked wobble for future days.
- Content: mock data stub for text/image/link; switch to Supabase later.

## Libraries (Expo-safe, low conflict)
- Already in use: `react-native-reanimated`, `moti`, NativeWind.
- Add when needed:
  - Background/blur: `expo-linear-gradient`, `expo-blur`.
  - Particles/shine: `lottie-react-native` (snow/shine JSONs).
  - Media (later): `expo-image`, `expo-av`.
  - UX: `expo-haptics`, `expo-clipboard`.

## Visual Spec (Cute/Cozy)
- Colors: night `#0F172A`, accent red `#E11D48`, green `#16A34A`, gold `#F59E0B`.
- Cards: rounded corners, soft shadow, subtle gold border; large day badge.
- Background: winter/Christmas feeling, low-contrast pattern; later replaceable.
- Motion: “koton → pak” (spring), small particle sparkle on reveal; locked wobble for future.

## Assets (Format & Placement)
- Format: PNG preferred (transparent for frames/decors). JPG ok for background.
- Sizes: background ≥1440×3040; frames/decors 512–1024px; particles 64–128px.
- Folders: `assets/ui/{backgrounds,doors,decorations,particles}/`.
- License must allow commercial use, no credit required, no redistribution.

## Search Queries (Commercial‑use oriented)
- Backgrounds
  - クリスマス パターン 商用利用 可愛い PNG 背景
  - winter seamless pattern commercial use cute png background
  - paper texture seamless commercial free
  - site:unsplash.com christmas pattern snow background
- Door/Frames/Decor
  - アドベント カレンダー ドア 素材 商用 PNG 透過
  - christmas door frame png commercial use transparent
  - 金箔 フレーム png 商用 / gold foil frame png commercial use
  - gift ribbon png transparent commercial use
- Particles / Lottie
  - 雪 png 透過 商用 / sparkle glitter png transparent commercial
  - lottiefiles snow free commercial use
- Tip (Google): add `filetype:png`, `seamless pattern`, `>2000px` to filter quality

## Do / Don’t
- Do: keep setup minimal (title + days). Focus on full-view grid + open animation.
- Do: start with mock content; swap to Supabase after visuals feel right.
- Don’t: add theme/notifications/profile now. Don’t overbuild server logic.
- Don’t: rely on unlicensed assets; record source & license.

## Milestones
- M1 (Day 1): full-view grid (14/24/30), gradient background, door styles, open animation, mock detail modal.
- M2 (Day 2): share screen UI (create link + passcode + copy), simple particles (Lottie) + haptics.
- M3 (Day 3): swap in first asset set (background/door/particle), polish spacing/contrast; prepare receiver flow next.

## Acceptance Checklist (Creator)
- Login → Setup (title + days) → Calendar (grid) → Edit day (mock content) → Share link (passcode optional).
- Open animation feels snappy and cute; locked days wobble gently; today highlighted.

## Open Questions / Next
- Asset direction: pick 1 background, 1 door frame, 1 snow asset first.
- Font: optional rounded/handwritten later (Expo Font).
- Receiver: anonymous claim screen polish after Creator MVP.

