import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  GroupBy,
  MasteryPoint,
  PartOfSpeechPoint,
  ProblematicWord,
  QuizFrequencyPoint,
  QuizResultsPoint,
  WordsOverTimePoint,
} from '../models/progress.model';

const BASE = `${environment.apiUrl}/words/stats`;

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly http = inject(HttpClient);

  getQuizFrequency(
    groupBy: GroupBy,
    from?: string,
    to?: string,
    studentId?: string,
  ): Observable<QuizFrequencyPoint[]> {
    const params: Record<string, string> = { groupBy };
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    if (studentId) params['studentId'] = studentId;
    return this.http.get<QuizFrequencyPoint[]>(`${BASE}/quiz-frequency`, {
      params,
    });
  }

  getMasteryOverTime(
    from?: string,
    to?: string,
    studentId?: string,
  ): Observable<MasteryPoint[]> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    if (studentId) params['studentId'] = studentId;
    return this.http.get<MasteryPoint[]>(`${BASE}/mastery-over-time`, {
      params,
    });
  }

  getWordsOverTime(
    from?: string,
    to?: string,
    studentId?: string,
  ): Observable<WordsOverTimePoint[]> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    if (studentId) params['studentId'] = studentId;
    return this.http.get<WordsOverTimePoint[]>(`${BASE}/words-over-time`, {
      params,
    });
  }

  getPartsOfSpeech(
    from?: string,
    to?: string,
    studentId?: string,
  ): Observable<PartOfSpeechPoint[]> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    if (studentId) params['studentId'] = studentId;
    return this.http.get<PartOfSpeechPoint[]>(`${BASE}/parts-of-speech`, {
      params,
    });
  }

  getQuizResults(
    from?: string,
    to?: string,
    studentId?: string,
  ): Observable<QuizResultsPoint[]> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    if (studentId) params['studentId'] = studentId;
    return this.http.get<QuizResultsPoint[]>(`${BASE}/quiz-results`, {
      params,
    });
  }

  getProblematicWords(
    limit: number,
    from?: string,
    to?: string,
    studentId?: string,
  ): Observable<ProblematicWord[]> {
    const params: Record<string, string> = { limit: String(limit) };
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    if (studentId) params['studentId'] = studentId;
    return this.http.get<ProblematicWord[]>(`${BASE}/problematic-words`, {
      params,
    });
  }
}
