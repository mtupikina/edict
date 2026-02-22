import { AbstractControl, ValidatorFn } from '@angular/forms';

import { PART_OF_SPEECH_OPTIONS } from '../models/word.model';

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
    return PART_OF_SPEECH_OPTIONS.includes(v) ? null : { partOfSpeech: { value: v } };
  };
}
