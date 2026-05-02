import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { CalendarValue } from '@/shared/components/calendar';
import { ZardDialogRef, Z_MODAL_DATA } from '@/shared/components/dialog';

import {
  ProgressCustomRangeDialogComponent,
  type ProgressCustomRangeDialogData,
} from './progress-custom-range-dialog.component';

describe('ProgressCustomRangeDialogComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  async function createFixture(
    data: ProgressCustomRangeDialogData,
  ): Promise<ComponentFixture<ProgressCustomRangeDialogComponent>> {
    await TestBed.configureTestingModule({
      imports: [ProgressCustomRangeDialogComponent],
      providers: [
        { provide: Z_MODAL_DATA, useValue: data },
        {
          provide: ZardDialogRef,
          useValue: jasmine.createSpyObj<ZardDialogRef<ProgressCustomRangeDialogComponent>>('ZardDialogRef', [
            'close',
          ]),
        },
      ],
    }).compileComponents();
    const f = TestBed.createComponent(ProgressCustomRangeDialogComponent);
    f.detectChanges();
    return f;
  }

  it('should create', async () => {
    const onApply = jasmine.createSpy('onApply');
    const maxDate = new Date(2026, 4, 2);
    const fixture = await createFixture({
      from: new Date(2026, 0, 1),
      to: new Date(2026, 0, 10),
      maxDate,
      onApply,
    });
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('calls onApply and closes when range completes from incomplete', async () => {
    const onApply = jasmine.createSpy('onApply');
    const dialogRef = jasmine.createSpyObj<ZardDialogRef<ProgressCustomRangeDialogComponent>>('ZardDialogRef', [
      'close',
    ]);
    const maxDate = new Date(2026, 4, 2);

    await TestBed.configureTestingModule({
      imports: [ProgressCustomRangeDialogComponent],
      providers: [
        {
          provide: Z_MODAL_DATA,
          useValue: {
            from: new Date(2026, 0, 1),
            to: new Date(2026, 0, 10),
            maxDate,
            onApply,
          } satisfies ProgressCustomRangeDialogData,
        },
        { provide: ZardDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgressCustomRangeDialogComponent);
    fixture.detectChanges();

    const inst = fixture.componentInstance as unknown as {
      onRangeValueChange(value: CalendarValue): void;
    };

    inst.onRangeValueChange([new Date(2026, 5, 1)]);
    inst.onRangeValueChange([new Date(2026, 5, 1), new Date(2026, 5, 15)]);

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.calls.mostRecent().args[0].from.getTime()).toBeLessThanOrEqual(
      onApply.calls.mostRecent().args[0].to.getTime(),
    );
    expect(dialogRef.close).toHaveBeenCalled();
  });
});
