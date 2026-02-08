// utils/paymentClipboard.ts
import * as Clipboard from 'expo-clipboard';
import { formatPrice, formatShortDate } from 'types/order.types';
import Toast from './Toast';
import type {
  PaymentOverview,
  CollectionsData,
  OutstandingOrder,
  AgingData,
  CustomerPaymentSummary,
  SalesReportData,
  ProfitLossData,
} from 'api/actions/paymentActions';

const fmtDate = (d: string) => {
  const date = new Date(d + 'T12:00:00');
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const dateRange = (start: string, end: string) =>
  start === end ? fmtDate(start) : `${fmtDate(start)} - ${fmtDate(end)}`;

const line = (text: string) => text + '\n';

export async function copyToClipboard(text: string) {
  await Clipboard.setStringAsync(text);
  Toast.success('Copied to clipboard');
}

// ─── OVERVIEW ────────────────────────────────────
export function formatOverviewText(
  overview: PaymentOverview,
  startDate: string,
  endDate: string
): string {
  const lines: string[] = [];
  const statuses = overview.byPaymentStatus;

  lines.push(`*Finestics - Payment Summary*`);
  lines.push(`📅 ${dateRange(startDate, endDate)}`);
  lines.push('');
  lines.push(`💰 Sales: ${formatPrice(overview.totalSales)}`);
  lines.push(`✅ Collected: ${formatPrice(overview.totalCollections)}`);
  lines.push(`⏳ Outstanding: ${formatPrice(overview.totalOutstanding)}`);
  lines.push(`📦 ${overview.orderCount} orders | Avg ${formatPrice(overview.avgOrderValue)}`);
  lines.push('');

  const rate =
    overview.totalSales > 0
      ? Math.round((overview.totalCollections / overview.totalSales) * 100)
      : 0;
  lines.push(`Collection Rate: ${rate}%`);
  lines.push('');

  lines.push(`✅ Paid: ${statuses.paid?.count || 0} (${formatPrice(statuses.paid?.totalAmount || 0)})`);
  lines.push(`⚠️ Partial: ${statuses.partial?.count || 0} (${formatPrice(statuses.partial?.totalAmount || 0)})`);
  lines.push(`❌ Unpaid: ${statuses.unpaid?.count || 0} (${formatPrice(statuses.unpaid?.totalAmount || 0)})`);

  if (overview.expenses) {
    lines.push('');
    lines.push(`💸 Expenses: ${formatPrice(overview.expenses.total)}`);
    lines.push(`📈 Net Revenue: ${formatPrice(overview.netRevenue || 0)}`);
  }

  return lines.join('\n');
}

// ─── COLLECTIONS ─────────────────────────────────
export function formatCollectionsText(
  collections: CollectionsData,
  startDate: string,
  endDate: string
): string {
  const lines: string[] = [];

  lines.push(`*Finestics - Collections*`);
  lines.push(`📅 ${dateRange(startDate, endDate)}`);
  lines.push('');
  lines.push(`💷 Total: ${formatPrice(collections.total)}`);
  lines.push('');

  for (const item of collections.data) {
    const label =
      collections.groupBy === 'customer'
        ? item.businessName || 'Unknown'
        : formatShortDate(item.period || null);
    lines.push(`${label} — ${item.orderCount} order${item.orderCount !== 1 ? 's' : ''} — ${formatPrice(item.totalCollected)}`);
  }

  return lines.join('\n');
}

// ─── OUTSTANDING ─────────────────────────────────
export function formatOutstandingText(
  orders: OutstandingOrder[],
  summary: { totalOrders: number; totalOutstanding: number }
): string {
  const lines: string[] = [];

  lines.push(`*Finestics - Outstanding*`);
  lines.push(`⏳ ${summary.totalOrders} unpaid | Total: ${formatPrice(summary.totalOutstanding)}`);
  lines.push('');

  for (const o of orders) {
    const age = o.daysOutstanding > 0 ? ` (${o.daysOutstanding}d)` : '';
    const paid = o.paidAmount > 0 ? ` | paid ${formatPrice(o.paidAmount)}` : '';
    lines.push(`• ${o.businessName} — ${o.orderNumber} — ${formatPrice(o.balanceAmount)}${paid}${age}`);
  }

  return lines.join('\n');
}

// ─── AGING ───────────────────────────────────────
export function formatAgingText(aging: AgingData): string {
  const lines: string[] = [];

  lines.push(`*Finestics - Aging Report*`);
  lines.push(`⏳ ${aging.totalOrdersOutstanding} orders | Total: ${formatPrice(aging.totalOutstanding)}`);
  lines.push('');

  const labels: Record<string, string> = {
    '0-7': '0-7 days',
    '8-15': '8-15 days',
    '16-30': '16-30 days',
    '30+': '30+ days',
  };

  for (const [key, bucket] of Object.entries(aging.buckets)) {
    lines.push(`${labels[key] || key}: ${bucket.count} orders — ${formatPrice(bucket.amount)} (${bucket.percentage}%)`);
  }

  if (aging.customerBreakdown.length > 0) {
    lines.push('');
    lines.push('*By Customer:*');
    for (const c of aging.customerBreakdown) {
      lines.push(`• ${c.businessName} — ${formatPrice(c.total)}`);
    }
  }

  return lines.join('\n');
}

// ─── CUSTOMERS ───────────────────────────────────
export function formatCustomersText(
  customers: CustomerPaymentSummary[],
  startDate: string,
  endDate: string
): string {
  const lines: string[] = [];

  lines.push(`*Finestics - Customer Payments*`);
  lines.push(`📅 ${dateRange(startDate, endDate)}`);
  lines.push('');

  for (const c of customers) {
    const owing = c.totalBalance > 0 ? ` | ⏳ ${formatPrice(c.totalBalance)}` : '';
    lines.push(`*${c.businessName}*`);
    lines.push(`  Sales ${formatPrice(c.totalAmount)} | Paid ${formatPrice(c.totalPaid)}${owing}`);
  }

  return lines.join('\n');
}

// ─── SALES REPORT ────────────────────────────────
export function formatSalesReportText(
  report: SalesReportData,
  startDate: string,
  endDate: string
): string {
  const lines: string[] = [];
  const s = report.summary;

  lines.push(`*Finestics - Sales Report*`);
  lines.push(`📅 ${dateRange(startDate, endDate)}`);
  lines.push('');
  lines.push(`💰 Sales: ${formatPrice(s.totalSales)}`);
  lines.push(`✅ Collected: ${formatPrice(s.totalCollected)}`);
  lines.push(`📦 ${s.orderCount} orders | Margin ${s.grossMargin}%`);
  lines.push(`📊 Gross Profit: ${formatPrice(s.grossProfit)}`);

  if (s.netProfit !== undefined) {
    lines.push(`📈 Net Profit: ${formatPrice(s.netProfit)} (${s.netMargin}%)`);
  }

  if (report.data.length > 0) {
    lines.push('');
    lines.push('*Breakdown:*');
    for (const item of report.data) {
      lines.push(`${formatShortDate(item.period)} — ${formatPrice(item.totalSales)} (${item.orderCount} orders)`);
    }
  }

  if (report.expenses) {
    lines.push('');
    lines.push(`💸 Expenses: ${formatPrice(report.expenses.total)}`);
    for (const cat of report.expenses.byCategory) {
      lines.push(`  • ${cat.category}: ${formatPrice(cat.totalAmount)}`);
    }
  }

  return lines.join('\n');
}

// ─── P&L REPORT ──────────────────────────────────
export function formatPnLText(
  pnl: ProfitLossData,
  startDate: string,
  endDate: string
): string {
  const lines: string[] = [];
  const current = pnl.current || pnl;

  lines.push(`*Finestics - Profit & Loss*`);
  lines.push(`📅 ${dateRange(startDate, endDate)}`);
  lines.push('');
  lines.push(`Revenue: ${formatPrice(current.revenue?.total || 0)}`);
  lines.push(`Cost of Goods: -${formatPrice(current.cogs || 0)}`);
  lines.push(`Gross Profit: ${formatPrice(current.grossProfit || 0)} (${current.grossMargin || 0}%)`);
  lines.push(`Expenses: -${formatPrice(current.expenses?.total || 0)}`);
  lines.push(`*Net Profit: ${formatPrice(current.netProfit || 0)} (${current.netMargin || 0}%)*`);

  if (current.expenses && Object.keys(current.expenses.byCategory).length > 0) {
    lines.push('');
    lines.push('*Expenses:*');
    for (const [cat, amount] of Object.entries(current.expenses.byCategory)) {
      lines.push(`  • ${cat}: ${formatPrice(amount as number)}`);
    }
  }

  return lines.join('\n');
}
