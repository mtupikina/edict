import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';

import { ProblematicWord } from '../../models/progress.model';
import { ProgressService } from '../../services/progress.service';

Chart.register(...registerables);

@Component({
  selector: 'app-problematic-words-chart',
  standalone: true,
  imports: [BaseChartDirective, FormsModule],
  templateUrl: './problematic-words-chart.component.html',
  host: { class: 'block' },
})
export class ProblematicWordsChartComponent implements OnChanges {
  @Input() studentId?: string;
  @Input() from?: string;
  @Input() to?: string;

  @ViewChild(BaseChartDirective) private chartRef?: BaseChartDirective;

  private readonly progressService = inject(ProgressService);

  protected limit = signal(15);
  protected loading = signal(false);
  protected error = signal<string | null>(null);

  protected chartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

  protected chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const raw = ctx.raw as number;
            return ` Marked for review: ${raw} time${raw === 1 ? '' : 's'}`;
          },
          afterLabel: (ctx) => {
            const idx = ctx.dataIndex;
            const rate = (ctx.chart.data as ChartData<'bar'> & { reviewRates: number[] }).reviewRates?.[idx];
            return rate !== undefined ? ` Review rate: ${rate}%` : '';
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: '#64748b',
          font: { size: 12 },
          precision: 0,
          stepSize: 1,
        },
        grid: { color: '#f1f5f9' },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#334155', font: { size: 12 } },
      },
    },
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['studentId'] || changes['from'] || changes['to']) {
      this.load();
    }
  }

  protected onLimitChange(value: number): void {
    const clamped = Math.min(50, Math.max(5, value));
    this.limit.set(clamped);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.progressService
      .getProblematicWords(this.limit(), this.from, this.to, this.studentId)
      .subscribe({
        next: (words) => this.buildChart(words),
        error: (err: { message?: string }) => {
          this.error.set(
            err?.message ?? 'Failed to load problematic words data',
          );
          this.loading.set(false);
        },
      });
  }

  private buildChart(words: ProblematicWord[]): void {
    const data: ChartData<'bar'> & { reviewRates: number[] } = {
      labels: words.map((w) =>
        w.translation ? `${w.word} — ${w.translation}` : w.word,
      ),
      datasets: [
        {
          label: 'Times marked for review',
          data: words.map((w) => w.reviewCount),
          backgroundColor: words.map((w) => {
            if (w.reviewRate >= 75) return 'rgba(239, 68, 68, 0.8)';
            if (w.reviewRate >= 50) return 'rgba(245, 158, 11, 0.8)';
            return 'rgba(99, 102, 241, 0.7)';
          }),
          borderWidth: 0,
          borderRadius: 4,
        },
      ],
      reviewRates: words.map((w) => w.reviewRate),
    };
    this.chartData.set(data);
    this.loading.set(false);
    setTimeout(() => this.chartRef?.update(), 0);
  }

  /** Compute chart height dynamically so bars don't get squished */
  protected get chartHeight(): string {
    const count = (this.chartData().labels?.length ?? 0);
    const px = Math.max(200, count * 36);
    return `${px}px`;
  }
}
