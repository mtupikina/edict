import { DEFAULT_FORM_VALUE, formValueToPayload, wordToFormValue, WordFormValue } from './word-form.utils';
import { Word } from '../models/word.model';

describe('word-form.utils', () => {
  describe('DEFAULT_FORM_VALUE', () => {
    it('should have empty string defaults', () => {
      expect(DEFAULT_FORM_VALUE.word).toBe('');
      expect(DEFAULT_FORM_VALUE.translation).toBe('');
      expect(DEFAULT_FORM_VALUE.partOfSpeech).toBe('');
    });
  });

  describe('wordToFormValue', () => {
    it('should map Word to form value', () => {
      const w: Word = {
        _id: '1',
        word: 'hello',
        translation: 'hallo',
        partOfSpeech: 'n',
        synonyms: ['a', 'b'],
        examples: ['e1'],
      };
      const v = wordToFormValue(w);
      expect(v.word).toBe('hello');
      expect(v.translation).toBe('hallo');
      expect(v.partOfSpeech).toBe('n');
      expect(v.synonymsText).toBe('a, b');
      expect(v.examplesText).toBe('e1');
    });

    it('should use empty string for missing optional fields', () => {
      const w: Word = { _id: '1', word: 'x' };
      const v = wordToFormValue(w);
      expect(v.translation).toBe('');
      expect(v.partOfSpeech).toBe('');
      expect(v.synonymsText).toBe('');
    });
  });

  describe('formValueToPayload', () => {
    it('should trim word and omit empty optionals', () => {
      const raw: WordFormValue = { ...DEFAULT_FORM_VALUE, word: '  test  ', translation: '' };
      const payload = formValueToPayload(raw);
      expect(payload.word).toBe('test');
      expect(payload.translation).toBeUndefined();
    });

    it('should parse comma-separated synonyms and tags', () => {
      const raw: WordFormValue = {
        ...DEFAULT_FORM_VALUE,
        word: 'x',
        synonymsText: 'a, b , c',
        tagsText: 't1',
      };
      const payload = formValueToPayload(raw);
      expect(payload.synonyms).toEqual(['a', 'b', 'c']);
      expect(payload.tags).toEqual(['t1']);
    });

    it('should parse newline-separated examples', () => {
      const raw: WordFormValue = {
        ...DEFAULT_FORM_VALUE,
        word: 'x',
        examplesText: 'e1\n e2 ',
      };
      const payload = formValueToPayload(raw);
      expect(payload.examples).toEqual(['e1', 'e2']);
    });

    it('should include optional fields when non-empty', () => {
      const raw: WordFormValue = {
        ...DEFAULT_FORM_VALUE,
        word: 'x',
        plural: 'plural',
        simplePast: 'past',
        pastParticiple: 'pp',
      };
      const payload = formValueToPayload(raw);
      expect(payload.plural).toBe('plural');
      expect(payload.simplePast).toBe('past');
      expect(payload.pastParticiple).toBe('pp');
    });
  });
});
