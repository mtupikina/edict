import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { WordsOverTimePoint } from '../../models/progress.model';
import { ProgressService } from '../../services/progress.service';
import { WordsOverTimeChartComponent } from './words-over-time-chart.component';

describe('WordsOverTimeChartComponent', () => {
  let fixture: ComponentFixture<WordsOverTimeChartComponent>;
  let component: WordsOverTimeChartComponent;
  let progressService: jasmine.SpyObj<ProgressService>;

  const samplePoints: WordsOverTimePoint[] = [
    { period: '2026-01', added: 10, cumulative: 10 },
    { period: '2026-02', added: 20, cumulative: 30 },
    { period: '2026-03', added: 30, cumulative: 60 },
  ];

  beforeEach(async () => {
    progressService = jasmine.createSpyObj('ProgressService', [
      'getWordsOverTime',
    ]);
    progressService.getWordsOverTime.and.returnValue(of(samplePoints));

    await TestBed.configureTestingModule({
      imports: [WordsOverTimeChartComponent],
      providers: [{ provide: ProgressService, useValue: progressService }],
    }).compileComponents();

    fixture = TestBed.createComponent(WordsOverTimeChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not load until an input changes', () => {
    fixture.detectChanges();
    expect(progressService.getWordsOverTime).not.toHaveBeenCalled();
  });

  it('loads data when each of studentId / from / to changes', () => {
    component.studentId = 'student-1';
    component.ngOnChanges({
      studentId: { currentValue: 'student-1' } as never,
    });
    component.from = '2026-01-01';
    component.ngOnChanges({ from: { currentValue: '2026-01-01' } as never });
    component.to = '2026-03-31';
    component.ngOnChanges({ to: { currentValue: '2026-03-31' } as never });
    expect(progressService.getWordsOverTime).toHaveBeenCalledTimes(3);
    expect(progressService.getWordsOverTime).toHaveBeenCalledWith(
      '2026-01-01',
      '2026-03-31',
      'student-1',
    );
  });

  it('ignores unrelated input changes', () => {
    component.ngOnChanges({ other: { currentValue: 'x' } as never });
    expect(progressService.getWordsOverTime).not.toHaveBeenCalled();
  });

  it('builds three datasets with monthly average computed in JS', () => {
    component.load();

    const data = (
      component as unknown as {
        chartData: () => { datasets: { label?: string; data: number[] }[] };
      }
    ).chartData();

    expect(data.datasets.length).toBe(3);
    expect(data.datasets[0].label).toBe('Added this month');
    // (10 + 20 + 30) / 3 = 20
    expect(data.datasets[1].label).toBe('Monthly avg (20)');
    expect(data.datasets[1].data).toEqual([20, 20, 20]);
    expect(data.datasets[2].label).toBe('Total');
    expect(data.datasets[2].data).toEqual([10, 30, 60]);
  });

  it('uses zero average when there are no points', () => {
    progressService.getWordsOverTime.and.returnValue(of([]));
    component.load();

    const data = (
      component as unknown as {
        chartData: () => { datasets: { label?: string }[] };
      }
    ).chartData();
    expect(data.datasets[1].label).toBe('Monthly avg (0)');
  });

  it('sets the error signal and clears loading on failure', () => {
    progressService.getWordsOverTime.and.returnValue(
      throwError(() => ({ message: 'boom' })),
    );
    component.load();

    const errorSig = (
      component as unknown as { error: () => string | null }
    ).error();
    const loadingSig = (
      component as unknown as { loading: () => boolean }
    ).loading();
    expect(errorSig).toBe('boom');
    expect(loadingSig).toBe(false);
  });

  it('falls back to a default error message when none is provided', () => {
    progressService.getWordsOverTime.and.returnValue(throwError(() => ({})));
    component.load();
    const errorSig = (
      component as unknown as { error: () => string | null }
    ).error();
    expect(errorSig).toBe('Failed to load word progress data');
  });

  describe('tooltip label callback', () => {
    type LabelCb = (ctx: {
      parsed: { y: number };
      dataset: { label?: string };
      chart: { data: { datasets: { data: number[] }[] } };
    }) => string;

    function getLabelCallback(): LabelCb {
      const opts = (
        component as unknown as {
          chartOptions: {
            plugins?: { tooltip?: { callbacks?: { label?: LabelCb } } };
          };
        }
      ).chartOptions;
      return opts.plugins!.tooltip!.callbacks!.label!;
    }

    function makeCtx(label: string, value: number, avg = 5): Parameters<LabelCb>[0] {
      return {
        parsed: { y: value },
        dataset: { label },
        chart: { data: { datasets: [{ data: [] }, { data: [avg] }] } },
      };
    }

    it('formats the monthly average label', () => {
      const cb = getLabelCallback();
      expect(cb(makeCtx('Monthly avg (5)', 5))).toBe(' Monthly avg: 5 words/month');
    });

    it('formats the cumulative total label with singular and plural', () => {
      const cb = getLabelCallback();
      expect(cb(makeCtx('Total', 1))).toBe(' Total: 1 word');
      expect(cb(makeCtx('Total', 7))).toBe(' Total: 7 words');
    });

    it('formats the added-this-month label with diff vs average', () => {
      const cb = getLabelCallback();
      expect(cb(makeCtx('Added this month', 8, 5))).toBe(
        ' Added: 8 words (+3.0 vs avg)',
      );
      expect(cb(makeCtx('Added this month', 1, 5))).toBe(
        ' Added: 1 word (-4.0 vs avg)',
      );
    });

    it('treats missing average as zero', () => {
      const cb = getLabelCallback();
      const ctx = makeCtx('Added this month', 4);
      ctx.chart.data.datasets[1].data = [];
      expect(cb(ctx)).toBe(' Added: 4 words (+4.0 vs avg)');
    });

    it('treats a missing dataset label like an added-this-month entry', () => {
      const cb = getLabelCallback();
      const ctx = makeCtx('', 2, 1);
      ctx.dataset.label = undefined;
      expect(cb(ctx)).toBe(' Added: 2 words (+1.0 vs avg)');
    });
  });
});
