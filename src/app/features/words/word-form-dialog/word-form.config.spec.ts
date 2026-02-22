import { getFieldError, WORD_FORM_FIELD_CONFIG } from './word-form.config';

describe('word-form.config', () => {
  describe('getFieldError', () => {
    it('should return null when no config for control', () => {
      expect(getFieldError('unknown', {}, null, WORD_FORM_FIELD_CONFIG)).toBeNull();
    });

    it('should return apiError when apiErrorPattern matches', () => {
      const config = { word: { messages: {}, apiErrorPattern: /word.*required/i } };
      expect(getFieldError('word', null, 'word is required', config)).toBe('word is required');
    });

    it('should return null when apiError does not match pattern', () => {
      const config = { word: { messages: {}, apiErrorPattern: /word.*required/i } };
      expect(getFieldError('word', null, 'other error', config)).toBeNull();
    });

    it('should return null when no control errors', () => {
      expect(getFieldError('word', null, null, WORD_FORM_FIELD_CONFIG)).toBeNull();
    });

    it('should return message for first validation error key', () => {
      expect(
        getFieldError('word', { required: true }, null, WORD_FORM_FIELD_CONFIG),
      ).toBe('Word is required');
    });

    it('should return partOfSpeech message for partOfSpeech error', () => {
      expect(
        getFieldError('partOfSpeech', { partOfSpeech: { value: 'x' } }, null, WORD_FORM_FIELD_CONFIG),
      ).toBe('Please select a valid part of speech');
    });

    it('should return null when first error key has no message in config', () => {
      const config = { word: { messages: { required: 'Required' } } };
      expect(getFieldError('word', { customError: true }, null, config)).toBeNull();
    });
  });
});
