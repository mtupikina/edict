import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  QuizWord,
  ToVerifyWord,
  WordVerifyUpdate,
} from '../models/check-words.model';

const BASE = `${environment.apiUrl}/words`;

@Injectable({ providedIn: 'root' })
export class CheckWordsService {
  private readonly http = inject(HttpClient);

  getToVerifyList(): Observable<ToVerifyWord[]> {
    return this.http.get<ToVerifyWord[]>(`${BASE}/verify/list`);
  }

  generateQuiz(count: number): Observable<QuizWord[]> {
    return this.http.post<QuizWord[]>(`${BASE}/verify/generate`, {
      count,
    });
  }

  submitQuiz(updates: WordVerifyUpdate[]): Observable<void> {
    return this.http.post<void>(`${BASE}/verify/submit`, { updates });
  }
}
