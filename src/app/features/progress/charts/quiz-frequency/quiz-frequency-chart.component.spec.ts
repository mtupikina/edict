import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { QuizFrequencyPoint } from '../../models/progress.model';
import { ProgressService } from '../../services/progress.service';
import { QuizFrequencyChartComponent } from './quiz-frequency-chart.component';

describe('QuizFrequencyChartComponent', () => {
  let fixture: ComponentFixture<QuizFrequencyChartComponent>;
  let component: QuizFrequencyChartComponent;
  let progressService: jasmine.SpyObj<ProgressService>;

  const monthlyPoints: QuizFrequencyPoint[] = [
    { period: '2026-03', count: 5 },
    { period: '2026-04', count: 3 },
  ];

  const weeklyPoints: QuizFrequencyPoint[] = [
    { period: '2026-W14', count: 4 },
    { period: '2026-W15', count: 2 },
  ];

  beforeEach(async () => {
    progressService = jasmine.createSpyObj('ProgressService', [
      'getQuizFrequency',
    ]);
    progressService.getQuizFrequency.and.returnValue(of(monthlyPoints));

    await TestBed.configureTestingModule({
      imports: [QuizFrequencyChartComponent],
      providers: [{ provide: ProgressService, useValue: progressService }],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizFrequencyChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults to month groupBy and queries the service accordingly', () => {
    component.load();
    expect(progressService.getQuizFrequency).toHaveBeenCalledWith(
      'month',
      undefined,
      undefined,
      undefined,
    );
  });

  it('formats month period labels in human-readable form', () => {
    component.load();
    const data = (
      component as unknown as {
        chartData: () => { labels?: unknown[]; datasets: { data: number[] }[] };
      }
    ).chartData();
    expect(data.labels).toEqual(['March 2026', 'April 2026']);
    expect(data.datasets[0].data).toEqual([5, 3]);
  });

  it('formats ISO week labels when groupBy is week', () => {
    progressService.getQuizFrequency.and.returnValue(of(weeklyPoints));
    (
      component as unknown as { onGroupByChange: (g: 'week' | 'month') => void }
    ).onGroupByChange('week');

    expect(progressService.getQuizFrequency).toHaveBeenCalledWith(
      'week',
      undefined,
      undefined,
      undefined,
    );
    const data = (
      component as unknown as { chartData: () => { labels?: unknown[] } }
    ).chartData();
    expect(data.labels).toEqual([
      'Mar 30 – Apr 5, 2026',
      'Apr 6–12, 2026',
    ]);
  });

  it('reloads when studentId / from / to change', () => {
    progressService.getQuizFrequency.calls.reset();
    component.studentId = 's1';
    component.ngOnChanges({ studentId: { currentValue: 's1' } as never });
    component.from = '2026-01-01';
    component.ngOnChanges({ from: { currentValue: '2026-01-01' } as never });
    component.to = '2026-04-30';
    component.ngOnChanges({ to: { currentValue: '2026-04-30' } as never });
    expect(progressService.getQuizFrequency).toHaveBeenCalledTimes(3);
  });

  it('ignores unrelated input changes', () => {
    component.ngOnChanges({ other: { currentValue: 'x' } as never });
    expect(progressService.getQuizFrequency).not.toHaveBeenCalled();
  });

  it('sets the error signal on failure', () => {
    progressService.getQuizFrequency.and.returnValue(
      throwError(() => ({ message: 'fail' })),
    );
    component.load();
    expect(
      (component as unknown as { error: () => string | null }).error(),
    ).toBe('fail');
  });

  it('uses the default error message when none is provided', () => {
    progressService.getQuizFrequency.and.returnValue(throwError(() => ({})));
    component.load();
    expect(
      (component as unknown as { error: () => string | null }).error(),
    ).toBe('Failed to load quiz frequency data');
  });

  describe('tooltip label callback', () => {
    type LabelCb = (ctx: { parsed: { y: number } }) => string;

    function getCallback(): LabelCb {
      const opts = (
        component as unknown as {
          chartOptions: {
            plugins?: { tooltip?: { callbacks?: { label?: LabelCb } } };
          };
        }
      ).chartOptions;
      return opts.plugins!.tooltip!.callbacks!.label!;
    }

    it('uses the singular form for one quiz day', () => {
      expect(getCallback()({ parsed: { y: 1 } })).toBe(' 1 quiz day');
    });

    it('uses the plural form for multiple quiz days', () => {
      expect(getCallback()({ parsed: { y: 4 } })).toBe(' 4 quiz days');
    });
  });
});
