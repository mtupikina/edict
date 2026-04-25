import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { PartOfSpeechPoint } from '../../models/progress.model';
import { ProgressService } from '../../services/progress.service';
import { PartsOfSpeechChartComponent } from './parts-of-speech-chart.component';

describe('PartsOfSpeechChartComponent', () => {
  let fixture: ComponentFixture<PartsOfSpeechChartComponent>;
  let component: PartsOfSpeechChartComponent;
  let progressService: jasmine.SpyObj<ProgressService>;

  const samplePoints: PartOfSpeechPoint[] = [
    { partOfSpeech: 'n', count: 100 },
    { partOfSpeech: 'v', count: 50 },
    { partOfSpeech: 'mystery', count: 25 },
  ];

  beforeEach(async () => {
    progressService = jasmine.createSpyObj('ProgressService', [
      'getPartsOfSpeech',
    ]);
    progressService.getPartsOfSpeech.and.returnValue(of(samplePoints));

    await TestBed.configureTestingModule({
      imports: [PartsOfSpeechChartComponent],
      providers: [{ provide: ProgressService, useValue: progressService }],
    }).compileComponents();

    fixture = TestBed.createComponent(PartsOfSpeechChartComponent);
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
    expect(progressService.getPartsOfSpeech).toHaveBeenCalledTimes(3);
  });

  it('ignores unrelated input changes', () => {
    component.ngOnChanges({ other: { currentValue: 'x' } as never });
    expect(progressService.getPartsOfSpeech).not.toHaveBeenCalled();
  });

  it('maps known POS codes to display labels and totals counts', () => {
    component.load();

    const data = (
      component as unknown as {
        chartData: () => {
            labels?: unknown[];
            datasets: { data: number[]; backgroundColor: string[] }[];
          };
        total: () => number;
      }
    ).chartData();

    expect(data.labels).toEqual(['Noun', 'Verb', 'mystery']);
    expect(data.datasets[0].data).toEqual([100, 50, 25]);
    expect(data.datasets[0].backgroundColor.length).toBe(3);

    expect(
      (component as unknown as { total: () => number }).total(),
    ).toBe(175);
  });

  it('falls back to the raw POS code when not in the dictionary', () => {
    progressService.getPartsOfSpeech.and.returnValue(
      of([{ partOfSpeech: 'xyz', count: 1 }]),
    );
    component.load();
    const data = (
      component as unknown as { chartData: () => { labels?: unknown[] } }
    ).chartData();
    expect(data.labels).toEqual(['xyz']);
  });

  it('sets the error signal on failure', () => {
    progressService.getPartsOfSpeech.and.returnValue(
      throwError(() => ({ message: 'broken' })),
    );
    component.load();
    expect(
      (component as unknown as { error: () => string | null }).error(),
    ).toBe('broken');
  });

  it('falls back to the default error message', () => {
    progressService.getPartsOfSpeech.and.returnValue(throwError(() => ({})));
    component.load();
    expect(
      (component as unknown as { error: () => string | null }).error(),
    ).toBe('Failed to load parts of speech data');
  });

  describe('tooltip label callback', () => {
    type LabelCb = (ctx: { parsed: number }) => string;

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

    it('formats a slice as count + percentage of the total', () => {
      component.load();
      const cb = getCallback();
      // total is 175 from the sample (100 + 50 + 25); 50/175 ≈ 29%
      expect(cb({ parsed: 50 })).toBe(' 50 words (29%)');
    });

    it('shows 0% when total is zero', () => {
      progressService.getPartsOfSpeech.and.returnValue(of([]));
      component.load();
      const cb = getCallback();
      expect(cb({ parsed: 0 })).toBe(' 0 words (0%)');
    });
  });
});
