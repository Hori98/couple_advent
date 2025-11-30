# Decorative Fonts (Optional)

We support two number-rendering modes in `components/AdventPreview.tsx`:
- SVG outline (default): white fill + gold stroke via react-native-svg
- Font mode: use a slim decorative font via expo-font

## Using Font Mode
1) Install packages:
   - `npx expo install expo-font`
   - (Option) `npx expo install @expo-google-fonts/cinzel`
2) Load the font at app root (e.g., in `app/_layout.tsx`):
   ```tsx
   import { useFonts, Cinzel_600SemiBold } from '@expo-google-fonts/cinzel';
   const [fontsLoaded] = useFonts({ Cinzel_600SemiBold });
   ```
3) In `AdventPreview.tsx`, set `NUMBER_STYLE` to `'font'` and uncomment `fontFamily: 'Cinzel_600SemiBold'`.
4) Adjust `fontWeight`, `fontSize`, and shadow to taste.

Fallback: if fonts fail to load, numbers render with system font.

