/**
 * Pure date helpers for progress (not `@Injectable`). Lives next to `ProgressService`.
 * Local calendar day at midnight — avoids UTC shifts from `toISOString().slice(0, 10)`.
 */
export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
