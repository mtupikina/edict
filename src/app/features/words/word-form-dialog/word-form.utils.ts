import { FormControl } from '@angular/forms';

import { Word } from '../models/word.model';

/** Form value shape (array fields as comma/newline-separated strings). */
export interface WordFormValue {
  word: string;
  translation: string;
  partOfSpeech: string;
  transcription: string;
  description: string;
  synonymsText: string;
  antonymsText: string;
  examplesText: string;
  tagsText: string;
  plural: string;
  simplePast: string;
  pastParticiple: string;
}

/** Typed form controls for reactive forms (source of truth in component class). */
export type WordFormControls = {
  [K in keyof WordFormValue]: FormControl<WordFormValue[K]>;
};

export const DEFAULT_FORM_VALUE: WordFormValue = {
  word: '',
  translation: '',
  partOfSpeech: '',
  transcription: '',
  description: '',
  synonymsText: '',
  antonymsText: '',
  examplesText: '',
  tagsText: '',
  plural: '',
  simplePast: '',
  pastParticiple: '',
};

export function wordToFormValue(w: Word): WordFormValue {
  return {
    word: w.word,
    translation: w.translation ?? '',
    partOfSpeech: w.partOfSpeech ?? '',
    transcription: w.transcription ?? '',
    description: w.description ?? '',
    synonymsText: (w.synonyms ?? []).join(', '),
    antonymsText: (w.antonyms ?? []).join(', '),
    examplesText: (w.examples ?? []).join('\n'),
    tagsText: (w.tags ?? []).join(', '),
    plural: w.plural ?? '',
    simplePast: w.simplePast ?? '',
    pastParticiple: w.pastParticiple ?? '',
  };
}

function parseCommaSeparated(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseNewlineSeparated(s: string): string[] {
  return s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
}

function trimOrUndefined(s: string): string | undefined {
  const t = s.trim();
  return t === '' ? undefined : t;
}

export function formValueToPayload(raw: WordFormValue): Partial<Word> {
  return {
    word: raw.word.trim(),
    translation: trimOrUndefined(raw.translation),
    partOfSpeech: trimOrUndefined(raw.partOfSpeech),
    transcription: trimOrUndefined(raw.transcription),
    description: trimOrUndefined(raw.description),
    synonyms: parseCommaSeparated(raw.synonymsText),
    antonyms: parseCommaSeparated(raw.antonymsText),
    examples: parseNewlineSeparated(raw.examplesText),
    tags: parseCommaSeparated(raw.tagsText),
    plural: trimOrUndefined(raw.plural),
    simplePast: trimOrUndefined(raw.simplePast),
    pastParticiple: trimOrUndefined(raw.pastParticiple),
  };
}
