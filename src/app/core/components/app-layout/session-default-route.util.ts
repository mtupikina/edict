/**
 * Query flag: dual-mode user explicitly opened self vocabulary on `/` or `/words`
 * (so default tutor redirect must not run). Same idea as path-based tutor vs student URLs.
 */
export const SELF_VOCAB_QUERY_PARAM = 'self';
export const SELF_VOCAB_QUERY_VALUE = '1';

export function urlIndicatesSelfVocabLayout(fullUrl: string): boolean {
  const i = fullUrl.indexOf('?');
  if (i === -1) {
    return false;
  }
  const params = new URLSearchParams(fullUrl.slice(i + 1));
  return params.get(SELF_VOCAB_QUERY_PARAM) === SELF_VOCAB_QUERY_VALUE;
}

/**
 * After session load, replace bare check-words / words-list routes with the first tutee
 * when tutor scope is available, unless `?self=1` marks intentional self vocabulary.
 */
export function shouldNavigateToDefaultTutorRoute(options: {
  fullUrl: string;
  showTutorMode: boolean;
  showStudentMode: boolean;
  studentCount: number;
}): boolean {
  const path = options.fullUrl.split('?')[0];
  if (path !== '/' && path !== '' && path !== '/words') {
    return false;
  }
  if (!options.showTutorMode || options.studentCount === 0) {
    return false;
  }
  if (options.showStudentMode && urlIndicatesSelfVocabLayout(options.fullUrl)) {
    return false;
  }
  return true;
}
