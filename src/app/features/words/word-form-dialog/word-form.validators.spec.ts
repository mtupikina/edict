import { AbstractControl } from '@angular/forms';

import { partOfSpeechValidator, requiredTrimmed } from './word-form.validators';

describe('word-form.validators', () => {
  describe('requiredTrimmed', () => {
    it('should return error when value is not a string', () => {
      const c = { value: 123 } as AbstractControl;
      expect(requiredTrimmed()(c)).toEqual({ required: true });
    });

    it('should return error when value is empty or whitespace', () => {
      expect(requiredTrimmed()({ value: '' } as AbstractControl)).toEqual({ required: true });
      expect(requiredTrimmed()({ value: '   ' } as AbstractControl)).toEqual({ required: true });
    });

    it('should return null when value has non-whitespace', () => {
      expect(requiredTrimmed()({ value: 'a' } as AbstractControl)).toBeNull();
      expect(requiredTrimmed()({ value: '  a  ' } as AbstractControl)).toBeNull();
    });
  });

  describe('partOfSpeechValidator', () => {
    it('should return null when value is null or empty', () => {
      expect(partOfSpeechValidator()({ value: null } as AbstractControl)).toBeNull();
      expect(partOfSpeechValidator()({ value: '' } as AbstractControl)).toBeNull();
    });

    it('should return null for valid part of speech', () => {
      expect(partOfSpeechValidator()({ value: 'n' } as AbstractControl)).toBeNull();
      expect(partOfSpeechValidator()({ value: 'v' } as AbstractControl)).toBeNull();
      expect(partOfSpeechValidator()({ value: 'adj' } as AbstractControl)).toBeNull();
    });

    it('should return error for invalid part of speech', () => {
      const result = partOfSpeechValidator()({ value: 'invalid' } as AbstractControl);
      expect(result).toEqual({ partOfSpeech: { value: 'invalid' } });
    });
  });
});
