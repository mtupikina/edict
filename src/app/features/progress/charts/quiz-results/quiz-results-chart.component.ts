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
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';

import { CHART_LEGEND_LABELS } from '../chart-legend.config';
import { QuizResultsPoint } from '../../models/progress.model';
import { ProgressService } from '../../services/progress.service';

Chart.register(...registerables);

@Component({
  selector: 'app-quiz-results-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './quiz-results-chart.component.html',
  host: { class: 'block' },
})
export class QuizResultsChartComponent implements OnChanges {
  @Input() studentId?: string;
  @Input() from?: string;
  @Input() to?: string;

  @ViewChild(BaseChartDirective) private chartRef?: BaseChartDirective;

  private readonly progressService = inject(ProgressService);

  protected loading = signal(false);
  protected error = signal<string | null>(null);

  protected chartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

  protected chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: CHART_LEGEND_LABELS },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const raw = ctx.raw as number;
            return ` ${ctx.dataset.label}: ${raw}%`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        stacked: true,
        min: 0,
        max: 100,
        ticks: {
          color: '#64748b',
          font: { size: 12 },
          callback: (v) => `${v}%`,
        },
        grid: { color: '#f1f5f9' },
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
      .getQuizResults(this.from, this.to, this.studentId)
      .subscribe({
        next: (points) => this.buildChart(points),
        error: (err: { message?: string }) => {
          this.error.set(err?.message ?? 'Failed to load quiz results data');
          this.loading.set(false);
        },
      });
  }

  private buildChart(points: QuizResultsPoint[]): void {
    this.chartData.set({
      labels: points.map((p) => p.period),
      datasets: [
        {
          label: 'Known',
          data: points.map((p) => p.knownPct),
          backgroundColor: 'rgba(20, 184, 166, 0.8)',
          borderColor: 'rgb(13, 148, 136)',
          borderWidth: 1,
          borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4 },
          stack: 'results',
        },
        {
          label: 'Needs review',
          data: points.map((p) => p.reviewPct),
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: 'rgb(220, 38, 38)',
          borderWidth: 1,
          borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
          stack: 'results',
        },
      ],
    });
    this.loading.set(false);
    setTimeout(() => this.chartRef?.update(), 0);
  }
}
