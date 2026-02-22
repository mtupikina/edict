import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type { ClassValue };

export function mergeClasses(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const noopFn = () => void 0;
