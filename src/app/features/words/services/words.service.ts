import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Word, WordsPage } from '../models/word.model';

const BASE = `${environment.apiUrl}/words`;

@Injectable({ providedIn: 'root' })
export class WordsService {
  private readonly http = inject(HttpClient);

  getPage(
    limit = 20,
    cursor?: string,
    sortBy: 'word' | 'translation' | 'createdAt' = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
    search?: string,
  ): Observable<WordsPage> {
    const params: Record<string, string> = {
      limit: String(limit),
      sortBy,
      order,
      search: search?.trim() ?? '',
    };
    if (cursor) params['cursor'] = cursor;
    return this.http.get<WordsPage>(BASE, { params });
  }

  getOne(id: string): Observable<Word> {
    return this.http.get<Word>(`${BASE}/${id}`);
  }

  create(body: Partial<Word>): Observable<Word> {
    return this.http.post<Word>(BASE, body);
  }

  update(id: string, body: Partial<Word>): Observable<Word> {
    return this.http.patch<Word>(`${BASE}/${id}`, body);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${BASE}/${id}`);
  }
}
