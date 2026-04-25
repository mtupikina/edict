import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartOptions,
  registerables,
} from 'chart.js';

import { CHART_LEGEND_LABELS } from '../chart-legend.config';
import { WordsOverTimePoint } from '../../models/progress.model';
import { ProgressService } from '../../services/progress.service';

Chart.register(...registerables);

@Component({
  selector: 'app-words-over-time-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './words-over-time-chart.component.html',
  host: { class: 'block' },
})
export class WordsOverTimeChartComponent implements OnChanges {
  @Input() studentId?: string;
  @Input() from?: string;
  @Input() to?: string;

  @ViewChild(BaseChartDirective) private chartRef?: BaseChartDirective;

  private readonly progressService = inject(ProgressService);

  protected loading = signal(false);
  protected error = signal<string | null>(null);

  /** Mixed bar+line chart — typed via ChartConfiguration to allow dataset-level `type`. */
  protected chartData = signal<ChartConfiguration['data']>({
    labels: [],
    datasets: [],
  });

  protected chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: CHART_LEGEND_LABELS },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y as number;
            if ((ctx.dataset.label ?? '').startsWith('Monthly avg')) {
              return ` Monthly avg: ${v} words/month`;
            }
            if ((ctx.dataset.label ?? '') === 'Total') {
              return ` Total: ${v} word${v === 1 ? '' : 's'}`;
            }
            const avg = parseFloat(
              (ctx.chart.data.datasets[1]?.data[0] as number)?.toString() ?? '0',
            );
            const diff = v - avg;
            const sign = diff >= 0 ? '+' : '';
            return ` Added: ${v} word${v === 1 ? '' : 's'} (${sign}${diff.toFixed(1)} vs avg)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          maxTicksLimit: 12,
          autoSkip: true,
          maxRotation: 45,
        },
      },
      // Left axis — monthly additions + avg line
      y: {
        beginAtZero: true,
        position: 'left',
        title: { display: true, text: 'Words / month', color: '#94a3b8', font: { size: 11 } },
        ticks: { color: '#64748b', font: { size: 11 }, precision: 0 },
        grid: { color: '#f1f5f9' },
      },
      // Right axis — cumulative total
      yTotal: {
        beginAtZero: true,
        position: 'right',
        title: { display: true, text: 'Total words', color: '#94a3b8', font: { size: 11 } },
        ticks: { color: '#64748b', font: { size: 11 }, precision: 0 },
        grid: { drawOnChartArea: false },
      },
    },
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['studentId'] || changes['from'] || changes['to']) {
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.progressService
      .getWordsOverTime(this.from, this.to, this.studentId)
      .subscribe({
        next: (points) => this.buildChart(points),
        error: (err: { message?: string }) => {
          this.error.set(err?.message ?? 'Failed to load word progress data');
          this.loading.set(false);
        },
      });
  }

  private buildChart(points: WordsOverTimePoint[]): void {
    const avg = points.length
      ? +(points.reduce((s, p) => s + p.added, 0) / points.length).toFixed(1)
      : 0;

    this.chartData.set({
      labels: points.map((p) => p.period),
      datasets: [
        {
          label: 'Added this month',
          data: points.map((p) => p.added),
          backgroundColor: 'rgba(20, 184, 166, 0.75)',
          borderColor: 'rgb(13, 148, 136)',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y',
          order: 2,
        },
        {
          label: `Monthly avg (${avg})`,
          data: points.map(() => avg),
          type: 'line',
          borderColor: 'rgba(249, 115, 22, 0.85)',
          borderDash: [6, 4],
          borderWidth: 2,
          backgroundColor: 'transparent',
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0,
          yAxisID: 'y',
          order: 1,
        },
        {
          label: 'Total',
          data: points.map((p) => p.cumulative),
          type: 'line',
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'transparent',
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointRadius: points.length <= 24 ? 4 : 0,
          tension: 0.3,
          yAxisID: 'yTotal',
          order: 0,
        },
      ],
    });
    this.loading.set(false);
    setTimeout(() => this.chartRef?.update(), 0);
  }
}
