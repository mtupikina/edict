import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { SessionContextService } from '../../core/services/session-context.service';
import { ZardDialogOptions, ZardDialogService } from '@/shared/components/dialog';
import { MasteryChartComponent } from './charts/mastery/mastery-chart.component';
import { PartsOfSpeechChartComponent } from './charts/parts-of-speech/parts-of-speech-chart.component';
import { ProblematicWordsChartComponent } from './charts/problematic-words/problematic-words-chart.component';
import { QuizFrequencyChartComponent } from './charts/quiz-frequency/quiz-frequency-chart.component';
import { QuizResultsChartComponent } from './charts/quiz-results/quiz-results-chart.component';
import { WordsOverTimeChartComponent } from './charts/words-over-time/words-over-time-chart.component';
import {
  ProgressCustomRangeDialogComponent,
  type ProgressCustomRangeDialogData,
} from './progress-custom-range-dialog/progress-custom-range-dialog.component';
import { startOfLocalDay } from './services/date.utils';

export type DatePreset = '3m' | '6m' | '1y' | 'all' | 'custom';

export interface DatePresetOption {
  value: DatePreset;
  label: string;
}

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [
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
  private readonly dialog = inject(ZardDialogService);

  /** Preset pills only; custom range uses the separate dialog button. */
  protected readonly presetOptions: DatePresetOption[] = [
    { value: '3m', label: '3 months' },
    { value: '6m', label: '6 months' },
    { value: '1y', label: '1 year' },
    { value: 'all', label: 'All time' },
  ];

  protected preset = signal<DatePreset>('6m');
  protected customFromDate = signal<Date | null>(null);
  protected customToDate = signal<Date | null>(null);

  /** ISO date string passed to chart components (undefined = no filter). */
  protected from = computed<string | undefined>(() => {
    const p = this.preset();
    if (p === 'all') return undefined;
    if (p === 'custom') return this.dateToYmd(this.customFromDate());
    return this.presetFrom(p);
  });

  protected to = computed<string | undefined>(() => {
    if (this.preset() === 'custom') return this.dateToYmd(this.customToDate());
    return undefined;
  });

  protected studentId = computed<string | undefined>(
    () => this.session.selectedStudentId() ?? undefined,
  );

  /** Shown on the Custom control when a custom range is active. */
  protected readonly customRangeLabel = computed(() => {
    if (this.preset() !== 'custom') return '';
    const f = this.customFromDate();
    const t = this.customToDate();
    if (!f || !t) return 'Custom range';
    return `${this.formatShortDate(f)} – ${this.formatShortDate(t)}`;
  });

  ngOnInit(): void {
    const today = startOfLocalDay(new Date());
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    this.customToDate.set(today);
    this.customFromDate.set(sixMonthsAgo);
  }

  protected setPreset(p: DatePreset): void {
    this.preset.set(p);
  }

  protected openCustomRangeDialog(): void {
    const opts = new ZardDialogOptions<
      ProgressCustomRangeDialogComponent,
      ProgressCustomRangeDialogData
    >();
    opts.zContent = ProgressCustomRangeDialogComponent;
    opts.zClosable = false;
    opts.zHideFooter = true;
    opts.zCustomClasses = 'p-0 gap-0 w-max max-w-[calc(100vw-1rem)] border-slate-200 shadow-xl';
    opts.zWidth = 'max-content';
    opts.zData = {
      from: this.customFromDate(),
      to: this.customToDate(),
      maxDate: startOfLocalDay(new Date()),
      onApply: (r) => {
        this.customFromDate.set(r.from);
        this.customToDate.set(r.to);
        this.preset.set('custom');
      },
    };
    this.dialog.create(opts);
  }

  private presetFrom(p: '3m' | '6m' | '1y'): string {
    const d = new Date();
    if (p === '3m') d.setMonth(d.getMonth() - 3);
    else if (p === '6m') d.setMonth(d.getMonth() - 6);
    else d.setFullYear(d.getFullYear() - 1);
    return d.toISOString();
  }

  private dateToYmd(d: Date | null): string | undefined {
    if (!d) return undefined;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatShortDate(d: Date): string {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
