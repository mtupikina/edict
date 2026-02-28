/** Part-of-speech values supported by the API (must match backend PART_OF_SPEECH_VALUES). */
export const PART_OF_SPEECH_OPTIONS: readonly string[] = [
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

export interface Word {
  _id: string;
  word: string;
  translation?: string;
  description?: string;
  partOfSpeech?: string;
  transcription?: string;
  synonyms?: string[];
  antonyms?: string[];
  examples?: string[];
  tags?: string[];
  plural?: string;
  simplePast?: string;
  pastParticiple?: string;
  canSpell?: boolean;
  canEToU?: boolean;
  canUToE?: boolean;
  toVerifyNextTime?: boolean;
  lastVerifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WordsPage {
  items: Word[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}
