export type { PartOfSpeechKey } from '@/shared/constants/part-of-speech';
export {
  PART_OF_SPEECH_LABELS,
  PART_OF_SPEECH_OPTIONS,
  PART_OF_SPEECH_SELECT_ORDER,
  isValidPartOfSpeech,
  partOfSpeechLabelFor,
} from '@/shared/constants/part-of-speech';

/**
 * Lexical / content fields shared by API word documents and AI enrich payloads
 * (aligned with backend `Word` content + `AiEnrichedWordDto`).
 */
export interface WordContent {
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
}

export interface Word extends WordContent {
  _id: string;
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

export type AiEnrichedWordData = WordContent;
