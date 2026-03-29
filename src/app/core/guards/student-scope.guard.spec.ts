import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  convertToParamMap,
  Router,
  RouterStateSnapshot,
} from '@angular/router';

import type { AuthSession } from '../models/auth-session.model';
import { SessionContextService } from '../services/session-context.service';
import { studentScopeGuard } from './student-scope.guard';

function makeSession(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    userId: '507f1f77bcf86cd799439011',
    email: 't@test.com',
    firstName: 'T',
    lastName: 'U',
    roleNames: ['tutor'],
    showTutorMode: true,
    showStudentMode: true,
    defaultMode: 'tutor',
    students: [{ _id: 'stu1', firstName: 'A', lastName: 'One', email: 'a@test.com' }],
    ...overrides,
  };
}

describe('studentScopeGuard', () => {
  let router: jasmine.SpyObj<Router>;
  let sessionSig: ReturnType<typeof signal<AuthSession | null>>;
  let loadedSig: ReturnType<typeof signal<boolean>>;
  const urlTree = {} as ReturnType<Router['createUrlTree']>;

  beforeEach(() => {
    sessionSig = signal<AuthSession | null>(makeSession());
    loadedSig = signal(true);

    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue(urlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        {
          provide: SessionContextService,
          useValue: {
            session: sessionSig,
            loaded: loadedSig,
          } as Partial<SessionContextService>,
        },
      ],
    });
  });

  function runGuard(studentId: string | null, stateUrl: string) {
    const route = {
      paramMap: convertToParamMap(studentId ? { studentId } : {}),
    } as ActivatedRouteSnapshot;
    const state = { url: stateUrl } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => studentScopeGuard(route, state));
  }

  it('redirects to / when studentId param is missing', () => {
    const result = runGuard(null, '/student');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toBe(urlTree);
  });

  it('allows activation when session is not loaded yet', () => {
    loadedSig.set(false);
    const result = runGuard('stu1', '/student/stu1');
    expect(result).toBe(true);
  });

  it('redirects to / when showTutorMode is false', () => {
    sessionSig.set(makeSession({ showTutorMode: false }));
    const result = runGuard('stu1', '/student/stu1');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toBe(urlTree);
  });

  it('redirects to /words when showTutorMode is false on words path', () => {
    sessionSig.set(makeSession({ showTutorMode: false }));
    const result = runGuard('stu1', '/student/stu1/words');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/words']);
    expect(result).toBe(urlTree);
  });

  it('redirects unknown student to first student', () => {
    const result = runGuard('unknown', '/student/unknown');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/student', 'stu1']);
    expect(result).toBe(urlTree);
  });

  it('redirects unknown student on words path to fallback words URL', () => {
    const result = runGuard('unknown', '/student/unknown/words');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/student', 'stu1', 'words']);
    expect(result).toBe(urlTree);
  });

  it('redirects to / when student not in list and no fallback', () => {
    sessionSig.set(makeSession({ students: [] }));
    const result = runGuard('x', '/student/x');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toBe(urlTree);
  });

  it('allows when id is valid', () => {
    const result = runGuard('stu1', '/student/stu1');
    expect(result).toBe(true);
  });
});
