export const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

// JST helpers (UTC+9) without relying on Intl tz features
export const nowInJST = () => new Date(Date.now() + 9 * 60 * 60 * 1000);
export const jstMonth = () => nowInJST().getUTCMonth(); // 0-11
export const jstDate = () => nowInJST().getUTCDate();
export const isDecemberJST = () => jstMonth() === 11;
