/** Word item for the to-verify list (words marked toVerifyNextTime). */
export interface ToVerifyWord {
  _id: string;
  word: string;
  translation?: string;
  lastVerifiedAt?: string | null;
  canEToU?: boolean;
  canUToE?: boolean;
  toVerifyNextTime: boolean;
  createdAt?: string | null;
}

/** Word item in a generated quiz (toVerifyNextTime is local state for submit). */
export interface QuizWord {
  _id: string;
  word: string;
  translation?: string;
  canEToU?: boolean;
  canUToE?: boolean;
  toVerifyNextTime?: boolean;
  lastVerifiedAt?: string | null;
  createdAt?: string | null;
}

/** Update payload for a single word on quiz submit. */
export interface WordVerifyUpdate {
  wordId: string;
  word: string;
  translation?: string;
  canEToU?: boolean;
  canUToE?: boolean;
  toVerifyNextTime?: boolean;
}
