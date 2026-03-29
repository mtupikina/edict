import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import type { AuthSession } from '../models/auth-session.model';
import { SessionContextService } from '../services/session-context.service';
import { sessionWordsParamsInterceptor } from './session-words-params.interceptor';

describe('sessionWordsParamsInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let sessionSig: WritableSignal<AuthSession | null>;
  let modeSig: WritableSignal<'tutor' | 'student'>;
  let selectedStudentSig: WritableSignal<string | null>;
  const routerState = { url: '/' };

  beforeEach(() => {
    routerState.url = '/';
    sessionSig = signal<AuthSession | null>(null);
    modeSig = signal<'tutor' | 'student'>('student');
    selectedStudentSig = signal<string | null>(null);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([sessionWordsParamsInterceptor])),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: {
            get url() {
              return routerState.url;
            },
          },
        },
        {
          provide: SessionContextService,
          useValue: {
            session: sessionSig,
            mode: modeSig,
            selectedStudentId: selectedStudentSig,
          },
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds studentId with current user when tutor-capable user is in student mode', () => {
    sessionSig.set({
      userId: 'user-oid-1',
      email: 'a@x.com',
      firstName: null,
      lastName: null,
      roleNames: ['admin'],
      showTutorMode: true,
      showStudentMode: true,
      defaultMode: 'student',
      students: [{ _id: 't1', firstName: 'T', lastName: '1', email: 't@x.com' }],
    });
    modeSig.set('student');

    http.get(`${environment.apiUrl}/words`, { params: { limit: '20' } }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.split('?')[0] === `${environment.apiUrl}/words`,
    );
    expect(req.request.params.get('studentId')).toBe('user-oid-1');
    expect(req.request.params.get('limit')).toBe('20');
    req.flush({});
  });

  it('adds selected tutee studentId in tutor mode', () => {
    sessionSig.set({
      userId: 'user-oid-1',
      email: 'a@x.com',
      firstName: null,
      lastName: null,
      roleNames: ['tutor'],
      showTutorMode: true,
      showStudentMode: true,
      defaultMode: 'tutor',
      students: [{ _id: 'tutee-1', firstName: 'S', lastName: '1', email: 's@x.com' }],
    });
    modeSig.set('tutor');
    selectedStudentSig.set('tutee-1');

    http.get(`${environment.apiUrl}/words/verify/list`).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.split('?')[0] === `${environment.apiUrl}/words/verify/list`,
    );
    expect(req.request.params.get('studentId')).toBe('tutee-1');
    req.flush([]);
  });

  it('uses tutee id from /student/:id URL when session mode has not synced yet', () => {
    routerState.url = '/student/tutee-from-url';
    sessionSig.set({
      userId: 'tutor-own-id',
      email: 'a@x.com',
      firstName: null,
      lastName: null,
      roleNames: ['tutor'],
      showTutorMode: true,
      showStudentMode: true,
      defaultMode: 'tutor',
      students: [{ _id: 'tutee-from-url', firstName: 'S', lastName: '1', email: 's@x.com' }],
    });
    modeSig.set('student');
    selectedStudentSig.set(null);

    http.get(`${environment.apiUrl}/words/verify/list`).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.split('?')[0] === `${environment.apiUrl}/words/verify/list`,
    );
    expect(req.request.params.get('studentId')).toBe('tutee-from-url');
    req.flush([]);
  });

  it('does not add studentId for student-only session', () => {
    sessionSig.set({
      userId: 'stu-1',
      email: 's@x.com',
      firstName: null,
      lastName: null,
      roleNames: ['student'],
      showTutorMode: false,
      showStudentMode: true,
      defaultMode: 'student',
      students: [],
    });
    modeSig.set('student');

    http.get(`${environment.apiUrl}/words`).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.split('?')[0] === `${environment.apiUrl}/words`,
    );
    expect(req.request.params.has('studentId')).toBe(false);
    req.flush({ items: [], nextCursor: null, hasMore: false, totalCount: 0 });
  });
});
