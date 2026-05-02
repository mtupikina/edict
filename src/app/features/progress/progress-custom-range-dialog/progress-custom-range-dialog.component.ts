import { Component, inject, signal } from '@angular/core';

import type { CalendarValue } from '@/shared/components/calendar';
import { ZardCalendarComponent } from '@/shared/components/calendar';
import { ZardDialogRef, Z_MODAL_DATA } from '@/shared/components/dialog';

import { startOfLocalDay } from '../services/date.utils';

export interface ProgressCustomRangeDialogData {
  from: Date | null;
  to: Date | null;
  maxDate: Date;
  onApply: (range: { from: Date; to: Date }) => void;
}

function initialRangeFromData(data: ProgressCustomRangeDialogData): Date[] | null {
  const f = data.from;
  const t = data.to;
  if (!f || !t) return null;
  const from = startOfLocalDay(f);
  const to = startOfLocalDay(t);
  return from.getTime() <= to.getTime() ? [from, to] : [to, from];
}

@Component({
  selector: 'app-progress-custom-range-dialog',
  standalone: true,
  imports: [ZardCalendarComponent],
  templateUrl: './progress-custom-range-dialog.component.html',
  host: { class: 'block' },
})
export class ProgressCustomRangeDialogComponent {
  private readonly data = inject<ProgressCustomRangeDialogData>(Z_MODAL_DATA);
  private readonly dialogRef = inject(ZardDialogRef<ProgressCustomRangeDialogComponent>);

  protected readonly maxDate = this.data.maxDate;
  protected readonly rangeValue = signal<Date[] | null>(initialRangeFromData(this.data));

  protected onRangeValueChange(value: CalendarValue): void {
    const prev = this.rangeValue();

    let next: Date[] | null = null;
    if (value === null) {
      next = null;
    } else if (Array.isArray(value)) {
      next = value.length ? [...value] : null;
    } else {
      next = [value];
    }

    const wasComplete = Array.isArray(prev) && prev.length === 2;
    const isComplete = Array.isArray(next) && next.length === 2;

    this.rangeValue.set(next);

    // Only close when the user just finished the range (not on initial two-date bind).
    if (isComplete && !wasComplete) {
      const pair = next as [Date, Date];
      const [a, b] = pair;
      const x = startOfLocalDay(a);
      const y = startOfLocalDay(b);
      const ordered =
        x.getTime() <= y.getTime()
          ? { from: x, to: y }
          : { from: y, to: x };
      this.data.onApply(ordered);
      this.dialogRef.close();
    }
  }
}
