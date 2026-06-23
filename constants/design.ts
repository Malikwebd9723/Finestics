import type { TextStyle } from 'react-native';

/**
 * Finestics design tokens — single source of truth for brand typography.
 * Swap the brand family here and the whole app follows.
 * The full ruleset lives in .claude/skills/finestics-design/SKILL.md.
 *
 * Colors are NOT defined here on purpose: keep using `useThemeContext().colors`
 * so light/dark stays correct. These tokens only own type + shape.
 */

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

// Custom fonts ignore fontWeight in RN — each weight is its own family.
// Numbers carry tabular figures so money columns align like a ledger.
const tnum = ['tabular-nums'] as TextStyle['fontVariant'];

/** Brand type roles. Use these for headings + numbers; body stays system. */
export const typo = {
  /** the single hero number, one per screen */
  display: {
    fontFamily: fonts.extrabold,
    fontSize: 37,
    lineHeight: 41,
    letterSpacing: -0.6,
    fontVariant: tnum,
  },
  /** screen titles */
  title: { fontFamily: fonts.bold, fontSize: 22, letterSpacing: -0.2 },
  /** stat-row values and any prominent money figure */
  stat: { fontFamily: fonts.bold, fontSize: 19, fontVariant: tnum },
  /** inline number mixin (apply over any value) */
  num: { fontFamily: fonts.bold, fontVariant: tnum },
  /** the one allowed section label style — used sparingly */
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.0 },
} satisfies Record<string, TextStyle>;

export const radius = { card: 20, chip: 12, pill: 999 } as const;
