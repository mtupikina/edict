export interface QuizFrequencyPoint {
  period: string;
  count: number;
}

export interface MasteryPoint {
  period: string;
  canEToUPct: number;
  canUToEPct: number;
  canEToUCount: number;
  canUToECount: number;
  totalEntries: number;
}

export interface WordsOverTimePoint {
  period: string;
  added: number;
  cumulative: number;
}

export interface PartOfSpeechPoint {
  partOfSpeech: string;
  count: number;
}

export interface QuizResultsPoint {
  period: string;
  knownCount: number;
  reviewCount: number;
  knownPct: number;
  reviewPct: number;
  total: number;
}

export interface ProblematicWord {
  wordId: string;
  word: string;
  translation?: string;
  reviewCount: number;
  totalAppearances: number;
  reviewRate: number;
}

export type GroupBy = 'week' | 'month';
