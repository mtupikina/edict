import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MasteryPoint } from '../../models/progress.model';
import { ProgressService } from '../../services/progress.service';
import { MasteryChartComponent } from './mastery-chart.component';

describe('MasteryChartComponent', () => {
  let fixture: ComponentFixture<MasteryChartComponent>;
  let component: MasteryChartComponent;
  let progressService: jasmine.SpyObj<ProgressService>;

  const samplePoints: MasteryPoint[] = [
    {
      period: '2026-W14',
      canEToUPct: 80,
      canUToEPct: 75,
      canEToUCount: 4,
      canUToECount: 3,
      totalEntries: 5,
    },
    {
      period: '2026-W15',
      canEToUPct: 90,
      canUToEPct: 85,
      canEToUCount: 9,
      canUToECount: 8,
      totalEntries: 10,
    },
  ];

  beforeEach(async () => {
    progressService = jasmine.createSpyObj('ProgressService', [
      'getMasteryOverTime',
    ]);
    progressService.getMasteryOverTime.and.returnValue(of(samplePoints));

    await TestBed.configureTestingModule({
      imports: [MasteryChartComponent],
      providers: [{ provide: ProgressService, useValue: progressService }],
    }).compileComponents();

    fixture = TestBed.createComponent(MasteryChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads when studentId / from / to change', () => {
    component.studentId = 's1';
    component.ngOnChanges({ studentId: { currentValue: 's1' } as never });
    component.from = '2026-01-01';
    component.ngOnChanges({ from: { currentValue: '2026-01-01' } as never });
    component.to = '2026-04-30';
    component.ngOnChanges({ to: { currentValue: '2026-04-30' } as never });
    expect(progressService.getMasteryOverTime).toHaveBeenCalledTimes(3);
  });

  it('does nothing when an unrelated input changes', () => {
    component.ngOnChanges({ other: { currentValue: 'x' } as never });
    expect(progressService.getMasteryOverTime).not.toHaveBeenCalled();
  });

  it('formats ISO week labels and emits both direction datasets', () => {
    component.load();
    const data = (
      component as unknown as {
        chartData: () => {
            labels?: unknown[];
            datasets: { label?: string; data: number[] }[];
          };
      }
    ).chartData();

    expect(data.labels).toEqual([
      'Mar 30 – Apr 5, 2026',
      'Apr 6–12, 2026',
    ]);
    expect(data.datasets[0].label).toBe('English → Ukrainian');
    expect(data.datasets[0].data).toEqual([80, 90]);
    expect(data.datasets[1].label).toBe('Ukrainian → English');
    expect(data.datasets[1].data).toEqual([75, 85]);
  });

  it('sets the error signal on failure', () => {
    progressService.getMasteryOverTime.and.returnValue(
      throwError(() => ({ message: 'nope' })),
    );
    component.load();
    expect(
      (component as unknown as { error: () => string | null }).error(),
    ).toBe('nope');
  });

  it('uses the default error message when none is provided', () => {
    progressService.getMasteryOverTime.and.returnValue(throwError(() => ({})));
    component.load();
    expect(
      (component as unknown as { error: () => string | null }).error(),
    ).toBe('Failed to load mastery data');
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
      expect(cb({ raw: 87, dataset: { label: 'English → Ukrainian' } })).toBe(
        ' English → Ukrainian: 87%',
      );
    });

    it('formats y-axis tick labels as percentages', () => {
      const cb = getOptions().scales!.y!.ticks!.callback!;
      expect(cb(50)).toBe('50%');
      expect(cb(100)).toBe('100%');
    });
  });
});
