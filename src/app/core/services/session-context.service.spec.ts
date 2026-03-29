import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SessionContextService } from './session-context.service';

const tutorMultiStudentPayload = {
  userId: '1',
  email: 'tutor@test.com',
  firstName: 'T',
  lastName: 'U',
  roleNames: ['tutor'],
  showTutorMode: true,
  showStudentMode: true,
  defaultMode: 'tutor' as const,
  students: [
    { _id: 'stu-first', firstName: 'Ann', lastName: 'A', email: 'a@stu.com' },
    { _id: 'stu-second', firstName: 'Bob', lastName: 'B', email: 'b@stu.com' },
  ],
};

describe('SessionContextService', () => {
  let service: SessionContextService;
  let httpMock: HttpTestingController;
  const routerState = { url: '/' };
  const routerEvents$ = new Subject<unknown>();

  beforeEach(() => {
    routerState.url = '/';
    TestBed.configureTestingModule({
      providers: [
        SessionContextService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: {
            get url() {
              return routerState.url;
            },
            events: routerEvents$.asObservable(),
          },
        },
      ],
    });
    service = TestBed.inject(SessionContextService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should default missing session fields from /auth/me', () => {
    service.loadSession();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    req.flush({
      email: 'partial@test.com',
      firstName: 'P',
      lastName: 'T',
    });
    expect(service.loaded()).toBe(true);
    expect(service.session()?.email).toBe('partial@test.com');
    expect(service.session()?.roleNames).toEqual([]);
    expect(service.session()?.showTutorMode).toBe(false);
    expect(service.session()?.showStudentMode).toBe(false);
    expect(service.noAccess()).toBe(true);
  });

  it('should load session and set flags', () => {
    service.loadSession();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    req.flush({
      userId: '1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      roleNames: ['student'],
      showTutorMode: false,
      showStudentMode: true,
      defaultMode: 'student',
      students: [],
    });
    expect(service.loaded()).toBe(true);
    expect(service.session()?.email).toBe('a@b.com');
    expect(service.noAccess()).toBe(false);
    expect(service.mode()).toBe('student');
    expect(service.selectedStudentId()).toBeNull();
  });

  it('should clear session', () => {
    service.syncModeFromUrl('/');
    expect(service.routeSyncGeneration()).toBe(1);
    service.clearSession();
    expect(service.session()).toBeNull();
    expect(service.loaded()).toBe(false);
    expect(service.routeSyncGeneration()).toBe(0);
  });

  it('should derive tutor scope from URL when path is /student/:id', () => {
    routerState.url = '/student/stu-first';
    service.loadSession();
    httpMock.expectOne(`${environment.apiUrl}/auth/me`).flush(tutorMultiStudentPayload);
    expect(service.mode()).toBe('tutor');
    expect(service.selectedStudentId()).toBe('stu-first');
    expect(service.canLoadWords()).toBe(true);
  });

  it('should use student id from URL, not default first student', () => {
    routerState.url = '/student/stu-second';
    service.loadSession();
    httpMock.expectOne(`${environment.apiUrl}/auth/me`).flush(tutorMultiStudentPayload);
    expect(service.mode()).toBe('tutor');
    expect(service.selectedStudentId()).toBe('stu-second');
  });

  it('syncModeFromUrl maps /student/:id/words to tutor', () => {
    service.syncModeFromUrl('/student/stu-first/words');
    expect(service.mode()).toBe('tutor');
    expect(service.selectedStudentId()).toBe('stu-first');
  });

  it('syncModeFromUrl maps / and /words to student mode', () => {
    service.syncModeFromUrl('/student/x');
    expect(service.mode()).toBe('tutor');
    service.syncModeFromUrl('/words');
    expect(service.mode()).toBe('student');
    expect(service.selectedStudentId()).toBeNull();
    service.syncModeFromUrl('/');
    expect(service.mode()).toBe('student');
  });

  it('syncModeFromUrl bumps routeSyncGeneration', () => {
    expect(service.routeSyncGeneration()).toBe(0);
    service.syncModeFromUrl('/');
    expect(service.routeSyncGeneration()).toBe(1);
    service.syncModeFromUrl('/student/a');
    expect(service.routeSyncGeneration()).toBe(2);
  });
});
