import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { QuizResultsPoint } from '../../models/progress.model';
import { ProgressService } from '../../services/progress.service';
import { QuizResultsChartComponent } from './quiz-results-chart.component';

describe('QuizResultsChartComponent', () => {
  let fixture: ComponentFixture<QuizResultsChartComponent>;
  let component: QuizResultsChartComponent;
  let progressService: jasmine.SpyObj<ProgressService>;

  const samplePoints: QuizResultsPoint[] = [
    {
      period: '2026-04-01',
      knownCount: 8,
      reviewCount: 2,
      knownPct: 80,
      reviewPct: 20,
      total: 10,
    },
    {
      period: '2026-04-02',
      knownCount: 5,
      reviewCount: 5,
      knownPct: 50,
      reviewPct: 50,
      total: 10,
    },
  ];

  beforeEach(async () => {
    progressService = jasmine.createSpyObj('ProgressService', [
      'getQuizResults',
    ]);
    progressService.getQuizResults.and.returnValue(of(samplePoints));

    await TestBed.configureTestingModule({
      imports: [QuizResultsChartComponent],
      providers: [{ provide: ProgressService, useValue: progressService }],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizResultsChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads data when studentId / from / to change', () => {
    component.studentId = 's1';
    component.ngOnChanges({ studentId: { currentValue: 's1' } as never });
    component.from = '2026-01-01';
    component.ngOnChanges({ from: { currentValue: '2026-01-01' } as never });
    component.to = '2026-04-30';
    component.ngOnChanges({ to: { currentValue: '2026-04-30' } as never });
    expect(progressService.getQuizResults).toHaveBeenCalledTimes(3);
  });

  it('ignores unrelated input changes', () => {
    component.ngOnChanges({ other: { currentValue: 'x' } as never });
    expect(progressService.getQuizResults).not.toHaveBeenCalled();
  });

  it('builds known and review datasets stacked together', () => {
    component.load();
    const data = (
      component as unknown as {
        chartData: () => {
            labels?: unknown[];
            datasets: { label?: string; data: number[]; stack?: string }[];
          };
      }
    ).chartData();

    expect(data.labels).toEqual(['2026-04-01', '2026-04-02']);
    expect(data.datasets[0].label).toBe('Known');
    expect(data.datasets[0].data).toEqual([80, 50]);
    expect(data.datasets[0].stack).toBe('results');
    expect(data.datasets[1].label).toBe('Needs review');
    expect(data.datasets[1].data).toEqual([20, 50]);
    expect(data.datasets[1].stack).toBe('results');
  });

  it('sets the error signal on failure', () => {
    progressService.getQuizResults.and.returnValue(
      throwError(() => ({ message: 'oops' })),
    );
    component.load();
    expect(
      (component as unknown as { error: () => string | null }).error(),
    ).toBe('oops');
  });

  it('uses the default error message when none is provided', () => {
    progressService.getQuizResults.and.returnValue(throwError(() => ({})));
    component.load();
    expect(
      (component as unknown as { error: () => string | null }).error(),
    ).toBe('Failed to load quiz results data');
  });

  describe('chart option callbacks', () => {
    interface OptionsShape {
      plugins?: {
        tooltip?: {
          callbacks?: {
            label?: (ctx: { raw: unknown; dataset: { label?: string } }) => string;
          };
        };
      };
      scales?: { y?: { ticks?: { callback?: (v: number | string) => string } } };
    }

    function getOptions(): OptionsShape {
      return (component as unknown as { chartOptions: OptionsShape }).chartOptions;
    }

    it('formats tooltip rows as a percentage with the dataset label', () => {
      const cb = getOptions().plugins!.tooltip!.callbacks!.label!;
      expect(cb({ raw: 80, dataset: { label: 'Known' } })).toBe(' Known: 80%');
    });

    it('formats y-axis tick labels as percentages', () => {
      const cb = getOptions().scales!.y!.ticks!.callback!;
      expect(cb(25)).toBe('25%');
    });
  });
});
