import { TextStyle } from 'react-native';

/**
 * Sistema tipográfico DomiLink v2
 * Escala modular basada en 4px
 */
export const Typography: Record<string, TextStyle> = {
  // Display
  display:  { fontSize: 36, fontWeight: '800', lineHeight: 44, letterSpacing: -0.5 },

  // Headings
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 36, letterSpacing: -0.3 },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32, letterSpacing: -0.2 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  h5: { fontSize: 16, fontWeight: '600', lineHeight: 24 },

  // Body
  body1: { fontSize: 16, fontWeight: '400', lineHeight: 26 },
  body2: { fontSize: 14, fontWeight: '400', lineHeight: 22 },
  body3: { fontSize: 13, fontWeight: '400', lineHeight: 20 },

  // Subtitle / Labels
  subtitle1: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  subtitle2: { fontSize: 14, fontWeight: '600', lineHeight: 22 },

  // Caption
  caption:  { fontSize: 12, fontWeight: '400', lineHeight: 18 },
  caption2: { fontSize: 11, fontWeight: '400', lineHeight: 16 },

  // Overline (tags, labels pequeños)
  overline: { fontSize: 10, fontWeight: '700', lineHeight: 16, letterSpacing: 1.2, textTransform: 'uppercase' },

  // Button
  button:   { fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  buttonSm: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },

  // Precio / cifras
  price:    { fontSize: 26, fontWeight: '800', lineHeight: 32 },
  priceLg:  { fontSize: 34, fontWeight: '800', lineHeight: 40, letterSpacing: -0.5 },
  priceSm:  { fontSize: 18, fontWeight: '700', lineHeight: 24 },
};
