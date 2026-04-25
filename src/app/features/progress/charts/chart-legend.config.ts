import type { LegendOptions } from 'chart.js';

/**
 * Shared legend configuration for all progress charts.
 *
 * Chart.js renders an oval (instead of a circle) when `pointStyleWidth`
 * differs from `boxHeight`. Using equal `boxWidth` and `boxHeight` and
 * skipping `pointStyleWidth` produces a perfect circle.
 */
export const CHART_LEGEND_LABELS: Partial<
  NonNullable<LegendOptions<'bar'>['labels']>
> = {
  usePointStyle: true,
  boxWidth: 8,
  boxHeight: 8,
  color: '#64748b',
  font: { size: 12 },
  padding: 16,
};
