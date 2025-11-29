export type AdventTheme = {
  name: string;
  background: string;
  cardBgUnlocked: string;
  cardBgLocked: string;
  borderColor: string;
  badgeBg: string;
  textMuted: string;
  snowCount: number;
};

export const THEMES: Record<number, AdventTheme> = {
  14: {
    name: 'Cozy Red',
    background: '#1b1420',
    cardBgUnlocked: 'rgba(255,255,255,0.96)',
    cardBgLocked: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(244,114,182,0.8)',
    badgeBg: '#e11d48',
    textMuted: 'rgba(255,255,255,0.7)',
    snowCount: 10,
  },
  24: {
    name: 'Classic Green',
    background: '#0f172a',
    cardBgUnlocked: 'rgba(255,255,255,0.95)',
    cardBgLocked: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(245,158,11,0.8)',
    badgeBg: '#16a34a',
    textMuted: 'rgba(255,255,255,0.7)',
    snowCount: 16,
  },
  30: {
    name: 'Frosty Blue',
    background: '#0b1220',
    cardBgUnlocked: 'rgba(240,248,255,0.95)',
    cardBgLocked: 'rgba(240,248,255,0.12)',
    borderColor: 'rgba(96,165,250,0.8)',
    badgeBg: '#60a5fa',
    textMuted: 'rgba(226,232,240,0.7)',
    snowCount: 22,
  },
};

export const pickTheme = (days?: number): AdventTheme => {
  if (days && THEMES[days]) return THEMES[days];
  return THEMES[24];
};

