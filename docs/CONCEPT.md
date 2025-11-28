# Couple Advent — Concept & Rules

## Roles
- Creator: signs in, builds an advent (14/24/30 days), shares a link.
- Receiver: no sign-up required; gets access via share link (anonymous auth under the hood). Can later sign up to create their own.

## Calendar Rules (JST)
- Unlock rule: 1 door per day by Japan Standard Time (UTC+9).
- Carryover: unopened past days can be opened anytime later.
- Configurable days: 14 / 24 / 30.

## Sharing & Access Control
- One-person-only link: First visitor “claims” the link; others are rejected.
- Optional expiry: Creator may set an expiration for links.
- Security: Random 16–32 char code; RLS restricts reads to claimed user or relationship members.
- Future options: passcode, device binding, audit logs.

## Content Types (MVP)
- Text: message.
- Image: stored in Supabase Storage, displayed via signed URL.
- YouTube / Link (next): external link with CTA; YouTube opens in app/browser.
- Video (next): `expo-av` player with signed URL.

## UX Priorities
- Cute winter/Christmas theme, delightful door opening moment.
- Smooth animations (door open, snow/kira particles), quick feedback.
- Minimize friction: receiver opens via link without sign-up.

## Do / Don’t
- Do: ship fast, keep flows minimal, prioritize animation polish.
- Do: rely on anonymous auth for safe public sharing.
- Don’t: overbuild server logic early; keep rules client-side for MVP.
- Don’t: expose public storage URLs; always use signed URLs.

