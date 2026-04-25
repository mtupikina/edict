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

import { formatPeriodLabel } from '../period-format.util';
import { QuizFrequencyPoint, GroupBy } from '../../models/progress.model';
import { ProgressService } from '../../services/progress.service';

Chart.register(...registerables);

@Component({
  selector: 'app-quiz-frequency-chart',
  standalone: true,
  imports: [BaseChartDirective, FormsModule],
  templateUrl: './quiz-frequency-chart.component.html',
  host: { class: 'block h-full' },
})
export class QuizFrequencyChartComponent implements OnChanges {
  @Input() studentId?: string;
  @Input() from?: string;
  @Input() to?: string;

  @ViewChild(BaseChartDirective) private chartRef?: BaseChartDirective;

  private readonly progressService = inject(ProgressService);

  protected groupBy = signal<GroupBy>('month');
  protected loading = signal(false);
  protected error = signal<string | null>(null);

  protected chartData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [],
  });

  protected chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y} quiz day${ctx.parsed.y === 1 ? '' : 's'}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 12 } },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#64748b',
          font: { size: 12 },
          stepSize: 1,
          precision: 0,
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

  protected onGroupByChange(value: GroupBy): void {
    this.groupBy.set(value);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.progressService
      .getQuizFrequency(this.groupBy(), this.from, this.to, this.studentId)
      .subscribe({
        next: (points) => this.buildChart(points),
        error: (err: { message?: string }) => {
          this.error.set(err?.message ?? 'Failed to load quiz frequency data');
          this.loading.set(false);
        },
      });
  }

  private buildChart(points: QuizFrequencyPoint[]): void {
    this.chartData.set({
      labels: points.map((p) => formatPeriodLabel(p.period)),
      datasets: [
        {
          label: 'Quizzes',
          data: points.map((p) => p.count),
          backgroundColor: 'rgba(20, 184, 166, 0.75)',
          borderColor: 'rgb(13, 148, 136)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    });
    this.loading.set(false);
    setTimeout(() => this.chartRef?.update(), 0);
  }
}
