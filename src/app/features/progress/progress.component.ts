import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SessionContextService } from '../../core/services/session-context.service';
import { MasteryChartComponent } from './charts/mastery/mastery-chart.component';
import { PartsOfSpeechChartComponent } from './charts/parts-of-speech/parts-of-speech-chart.component';
import { ProblematicWordsChartComponent } from './charts/problematic-words/problematic-words-chart.component';
import { QuizFrequencyChartComponent } from './charts/quiz-frequency/quiz-frequency-chart.component';
import { QuizResultsChartComponent } from './charts/quiz-results/quiz-results-chart.component';
import { WordsOverTimeChartComponent } from './charts/words-over-time/words-over-time-chart.component';

export type DatePreset = '3m' | '6m' | '1y' | 'all' | 'custom';

export interface DatePresetOption {
  value: DatePreset;
  label: string;
}

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [
    FormsModule,
    WordsOverTimeChartComponent,
    PartsOfSpeechChartComponent,
    QuizFrequencyChartComponent,
    QuizResultsChartComponent,
    MasteryChartComponent,
    ProblematicWordsChartComponent,
  ],
  templateUrl: './progress.component.html',
  host: { class: 'block' },
})
export class ProgressComponent implements OnInit {
  protected readonly session = inject(SessionContextService);

  protected readonly presetOptions: DatePresetOption[] = [
    { value: '3m', label: '3 months' },
    { value: '6m', label: '6 months' },
    { value: '1y', label: '1 year' },
    { value: 'all', label: 'All time' },
    { value: 'custom', label: 'Custom' },
  ];

  protected preset = signal<DatePreset>('6m');
  protected customFrom = signal<string>('');
  protected customTo = signal<string>('');

  /** ISO date string passed to chart components (undefined = no filter). */
  protected from = computed<string | undefined>(() => {
    const p = this.preset();
    if (p === 'all') return undefined;
    if (p === 'custom') return this.customFrom() || undefined;
    return this.presetFrom(p);
  });

  protected to = computed<string | undefined>(() => {
    if (this.preset() === 'custom') return this.customTo() || undefined;
    return undefined;
  });

  protected studentId = computed<string | undefined>(
    () => this.session.selectedStudentId() ?? undefined,
  );

  ngOnInit(): void {
    // Default custom dates to the last 6 months if user switches to custom
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    this.customTo.set(today.toISOString().slice(0, 10));
    this.customFrom.set(sixMonthsAgo.toISOString().slice(0, 10));
  }

  protected setPreset(p: DatePreset): void {
    this.preset.set(p);
  }

  private presetFrom(p: '3m' | '6m' | '1y'): string {
    const d = new Date();
    if (p === '3m') d.setMonth(d.getMonth() - 3);
    else if (p === '6m') d.setMonth(d.getMonth() - 6);
    else d.setFullYear(d.getFullYear() - 1);
    return d.toISOString();
  }
}
