import { AbstractControl, ValidatorFn } from '@angular/forms';

import { isValidPartOfSpeech } from '@/shared/constants/part-of-speech';

export function requiredTrimmed(): ValidatorFn {
  return (c: AbstractControl) => {
    const v = c.value;
    if (typeof v !== 'string') return { required: true };
    return v.trim() ? null : { required: true };
  };
}

export function partOfSpeechValidator(): ValidatorFn {
  return (c: AbstractControl) => {
    const v = c.value;
    if (v == null || v === '') return null;
    if (typeof v !== 'string') return { partOfSpeech: { value: v } };
    return isValidPartOfSpeech(v) ? null : { partOfSpeech: { value: v } };
  };
}
