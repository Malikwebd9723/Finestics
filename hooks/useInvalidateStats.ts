import { useQueryClient } from '@tanstack/react-query';

const STATS_QUERY_KEYS = [
  ['dashboardStats'],
  ['detailedStats'],
  ['salesTrend'],
  ['customerStats'],
  ['productStats'],
  ['paymentOverview'],
  ['customers'],
  ['orders'],
  ['payments'],
  ['returns'],
] as const;

/**
 * Invalidate every query key whose cached data could have shifted after a
 * money-affecting write (order create, payment, return, bulk status change).
 *
 * React Query's `invalidateQueries({ queryKey: [X] })` matches any key that
 * starts with X, so ['orders'] covers ['orders', orderId] etc.
 */
export function useInvalidateStats() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of STATS_QUERY_KEYS) {
      queryClient.invalidateQueries({ queryKey: key as unknown as readonly unknown[] });
    }
  };
}
