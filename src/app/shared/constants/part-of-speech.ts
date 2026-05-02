/**
 * Part-of-speech values supported by the API.
 * Must match `edict-be` `PART_OF_SPEECH_VALUES` in `src/words/schemas/word.schema.ts`.
 */
export const PART_OF_SPEECH_OPTIONS = [
  'adj',
  'adv',
  'conj',
  'interj',
  'n',
  'num',
  'ph',
  'ph v',
  'prep',
  'pron',
  'v',
] as const;

export type PartOfSpeechKey = (typeof PART_OF_SPEECH_OPTIONS)[number];

/** Human-readable labels for UI (forms, lists, charts). */
export const PART_OF_SPEECH_LABELS: Record<PartOfSpeechKey, string> = {
  adj: 'Adjective',
  adv: 'Adverb',
  conj: 'Conjunction',
  interj: 'Interjection',
  n: 'Noun',
  num: 'Numeral',
  ph: 'Phrase',
  'ph v': 'Phrasal verb',
  prep: 'Preposition',
  pron: 'Pronoun',
  v: 'Verb',
};

/**
 * Order shown in selects: common choices first, then the rest.
 * Must be a permutation of {@link PART_OF_SPEECH_OPTIONS}.
 */
export const PART_OF_SPEECH_SELECT_ORDER = [
  'n',
  'v',
  'adj',
  'adv',
  'pron',
  'prep',
  'conj',
  'interj',
  'num',
  'ph',
  'ph v',
] as const satisfies readonly PartOfSpeechKey[];

export function partOfSpeechLabelFor(key: string | undefined | null): string {
  if (!key) return '';
  return key in PART_OF_SPEECH_LABELS ? PART_OF_SPEECH_LABELS[key as PartOfSpeechKey] : key;
}

export function isValidPartOfSpeech(value: string): value is PartOfSpeechKey {
  return (PART_OF_SPEECH_OPTIONS as readonly string[]).includes(value);
}
