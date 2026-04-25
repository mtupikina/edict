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
import { PartOfSpeechPoint } from '../../models/progress.model';
import { ProgressService } from '../../services/progress.service';

Chart.register(...registerables);

const POS_COLORS = [
  'rgba(20, 184, 166, 0.8)',
  'rgba(99, 102, 241, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(239, 68, 68, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(139, 92, 246, 0.8)',
  'rgba(236, 72, 153, 0.8)',
  'rgba(59, 130, 246, 0.8)',
  'rgba(249, 115, 22, 0.8)',
  'rgba(6, 182, 212, 0.8)',
  'rgba(132, 204, 22, 0.8)',
  'rgba(168, 85, 247, 0.8)',
];

const POS_LABELS: Record<string, string> = {
  adj: 'Adjective',
  adv: 'Adverb',
  conj: 'Conjunction',
  interj: 'Interjection',
  n: 'Noun',
  num: 'Numeral',
  ph: 'Phrase',
  'ph v': 'Phrasal Verb',
  prep: 'Preposition',
  pron: 'Pronoun',
  v: 'Verb',
  unset: 'Unset',
};

@Component({
  selector: 'app-parts-of-speech-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './parts-of-speech-chart.component.html',
  host: { class: 'block h-full' },
})
export class PartsOfSpeechChartComponent implements OnChanges {
  @Input() studentId?: string;
  @Input() from?: string;
  @Input() to?: string;

  @ViewChild(BaseChartDirective) private chartRef?: BaseChartDirective;

  private readonly progressService = inject(ProgressService);

  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected total = signal(0);

  protected chartData = signal<ChartData<'doughnut'>>({
    labels: [],
    datasets: [],
  });

  protected chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { ...CHART_LEGEND_LABELS, padding: 12 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed as number;
            const tot = this.total();
            const pct = tot > 0 ? Math.round((val / tot) * 100) : 0;
            return ` ${val} words (${pct}%)`;
          },
        },
      },
    },
    cutout: '60%',
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
      .getPartsOfSpeech(this.from, this.to, this.studentId)
      .subscribe({
        next: (points) => this.buildChart(points),
        error: (err: { message?: string }) => {
          this.error.set(
            err?.message ?? 'Failed to load parts of speech data',
          );
          this.loading.set(false);
        },
      });
  }

  private buildChart(points: PartOfSpeechPoint[]): void {
    this.total.set(points.reduce((s, p) => s + p.count, 0));
    this.chartData.set({
      labels: points.map(
        (p) => POS_LABELS[p.partOfSpeech] ?? p.partOfSpeech,
      ),
      datasets: [
        {
          data: points.map((p) => p.count),
          backgroundColor: points.map(
            (_, i) => POS_COLORS[i % POS_COLORS.length],
          ),
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 6,
        },
      ],
    });
    this.loading.set(false);
    // Canvas was hidden during loading — force Chart.js to paint once Angular
    // has re-inserted the canvas element into the DOM.
    setTimeout(() => this.chartRef?.update(), 0);
  }
}
