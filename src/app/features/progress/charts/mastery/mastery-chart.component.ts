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
import { formatPeriodLabel } from '../period-format.util';
import { MasteryPoint } from '../../models/progress.model';
import { ProgressService } from '../../services/progress.service';

Chart.register(...registerables);

@Component({
  selector: 'app-mastery-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './mastery-chart.component.html',
  host: { class: 'block' },
})
export class MasteryChartComponent implements OnChanges {
  @Input() studentId?: string;
  @Input() from?: string;
  @Input() to?: string;

  @ViewChild(BaseChartDirective) private chartRef?: BaseChartDirective;

  private readonly progressService = inject(ProgressService);

  protected loading = signal(false);
  protected error = signal<string | null>(null);

  protected chartData = signal<ChartData<'line'>>({
    labels: [],
    datasets: [],
  });

  protected chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
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
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 12 } },
      },
      y: {
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
      .getMasteryOverTime(this.from, this.to, this.studentId)
      .subscribe({
        next: (points) => this.buildChart(points),
        error: (err: { message?: string }) => {
          this.error.set(err?.message ?? 'Failed to load mastery data');
          this.loading.set(false);
        },
      });
  }

  private buildChart(points: MasteryPoint[]): void {
    this.chartData.set({
      labels: points.map((p) => formatPeriodLabel(p.period)),
      datasets: [
        {
          label: 'English → Ukrainian',
          data: points.map((p) => p.canEToUPct),
          borderColor: 'rgb(13, 148, 136)',
          backgroundColor: 'rgba(13, 148, 136, 0.1)',
          pointBackgroundColor: 'rgb(13, 148, 136)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Ukrainian → English',
          data: points.map((p) => p.canUToEPct),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          pointBackgroundColor: 'rgb(99, 102, 241)',
          tension: 0.3,
          fill: true,
        },
      ],
    });
    this.loading.set(false);
    setTimeout(() => this.chartRef?.update(), 0);
  }
}
