import {
  shouldNavigateToDefaultTutorRoute,
  SELF_VOCAB_QUERY_PARAM,
  SELF_VOCAB_QUERY_VALUE,
  urlIndicatesSelfVocabLayout,
} from './session-default-route.util';

describe('urlIndicatesSelfVocabLayout', () => {
  it('is true when self=1 is present', () => {
    expect(urlIndicatesSelfVocabLayout(`/?${SELF_VOCAB_QUERY_PARAM}=${SELF_VOCAB_QUERY_VALUE}`)).toBeTrue();
    expect(
      urlIndicatesSelfVocabLayout(`/words?x=1&${SELF_VOCAB_QUERY_PARAM}=${SELF_VOCAB_QUERY_VALUE}`),
    ).toBeTrue();
  });

  it('is false without query or wrong value', () => {
    expect(urlIndicatesSelfVocabLayout('/')).toBeFalse();
    expect(urlIndicatesSelfVocabLayout(`/words?${SELF_VOCAB_QUERY_PARAM}=0`)).toBeFalse();
  });
});

describe('shouldNavigateToDefaultTutorRoute', () => {
  const base = {
    fullUrl: '/',
    showTutorMode: true,
    showStudentMode: true,
    studentCount: 2,
  };

  it('is true for / with tutor + tutees and no self-query', () => {
    expect(shouldNavigateToDefaultTutorRoute({ ...base })).toBeTrue();
  });

  it('is true for /words under same conditions', () => {
    expect(shouldNavigateToDefaultTutorRoute({ ...base, fullUrl: '/words' })).toBeTrue();
  });

  it('is true for empty path segment', () => {
    expect(shouldNavigateToDefaultTutorRoute({ ...base, fullUrl: '' })).toBeTrue();
  });

  it('strips query string when matching path', () => {
    expect(shouldNavigateToDefaultTutorRoute({ ...base, fullUrl: '/words?tab=a' })).toBeTrue();
  });

  it('is false when path is already under /student', () => {
    expect(
      shouldNavigateToDefaultTutorRoute({
        ...base,
        fullUrl: '/student/stu1/words',
      }),
    ).toBeFalse();
  });

  it('is false when tutor mode is not available', () => {
    expect(shouldNavigateToDefaultTutorRoute({ ...base, showTutorMode: false })).toBeFalse();
  });

  it('is false when there are no tutees', () => {
    expect(shouldNavigateToDefaultTutorRoute({ ...base, studentCount: 0 })).toBeFalse();
  });

  it('is false when dual-mode user has self-vocab query', () => {
    expect(
      shouldNavigateToDefaultTutorRoute({
        ...base,
        fullUrl: `/?${SELF_VOCAB_QUERY_PARAM}=${SELF_VOCAB_QUERY_VALUE}`,
      }),
    ).toBeFalse();
  });

  it('is still true for tutor-only when URL has self query', () => {
    expect(
      shouldNavigateToDefaultTutorRoute({
        ...base,
        showStudentMode: false,
        fullUrl: `/?${SELF_VOCAB_QUERY_PARAM}=${SELF_VOCAB_QUERY_VALUE}`,
      }),
    ).toBeTrue();
  });
});
