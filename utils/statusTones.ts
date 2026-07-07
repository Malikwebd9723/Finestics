// utils/statusTones.ts
// Canonical status → tone mapping for the whole app. Tones resolve to theme
// colors at render time (no hex literals; dark-mode safe):
//   neutral -> colors.muted, active -> colors.primary,
//   positive -> colors.success, negative -> colors.error
//
// Badge recipe: text/icon in toneColor(...), background in toneTint(...).

export type StatusTone = 'neutral' | 'active' | 'positive' | 'negative';

/** Resolve a tone to a concrete theme color. */
export const toneColor = (tone: StatusTone, colors: Record<string, string>): string => {
  switch (tone) {
    case 'active':
      return colors.primary;
    case 'positive':
      return colors.success;
    case 'negative':
      return colors.error;
    default:
      return colors.muted;
  }
};

/** Soft pill background for a tone (the standard badge treatment). */
export const toneTint = (tone: StatusTone, colors: Record<string, string>): string =>
  toneColor(tone, colors) + '14';

// ---- Profile / account statuses (admin surfaces) ----

/** Vendor & customer profile statuses: pending | active | suspended | rejected */
export const PROFILE_STATUS_TONES: Record<string, StatusTone> = {
  pending: 'neutral',
  active: 'positive',
  suspended: 'negative',
  rejected: 'negative',
};

/** User account statuses: active | suspended | deleted */
export const ACCOUNT_STATUS_TONES: Record<string, StatusTone> = {
  active: 'positive',
  suspended: 'negative',
  deleted: 'negative',
};

// ---- Vendor-authored (wholesale) orders ----

/** Vendor order statuses: pending → completed lifecycle */
export const VENDOR_ORDER_STATUS_TONES: Record<string, StatusTone> = {
  pending: 'neutral',
  confirmed: 'active',
  collected: 'active',
  delivered: 'positive',
  completed: 'positive',
  cancelled: 'negative',
};

/** Payment statuses: unpaid | partial | paid */
export const PAYMENT_STATUS_TONES: Record<string, StatusTone> = {
  unpaid: 'negative',
  partial: 'neutral',
  paid: 'positive',
};

/** Order item statuses */
export const ITEM_STATUS_TONES: Record<string, StatusTone> = {
  pending: 'neutral',
  delivered: 'positive',
  partially_delivered: 'active',
  cancelled: 'negative',
};

/** Look up a tone from any of the maps above with a safe fallback. */
export const statusTone = (
  map: Record<string, StatusTone>,
  status: string | null | undefined
): StatusTone => (status && map[status]) || 'neutral';
