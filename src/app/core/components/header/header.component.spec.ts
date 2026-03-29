import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import type { AuthSession } from '../../models/auth-session.model';
import { AuthService } from '../../services/auth.service';
import { SessionContextService } from '../../services/session-context.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  const session = signal<AuthSession | null>({
    userId: '507f1f77bcf86cd799439011',
    email: 'u@test.com',
    firstName: 'Jane',
    lastName: 'Doe',
    roleNames: ['student'],
    showTutorMode: false,
    showStudentMode: true,
    defaultMode: 'student',
    students: [],
  });
  const mode = signal<'tutor' | 'student'>('student');
  const selectedStudentId = signal<string | null>(null);
  const mockSession: Partial<SessionContextService> = {
    session,
    loaded: signal(true),
    loadError: signal(false),
    loadSession: () => Subscription.EMPTY,
    clearSession: jasmine.createSpy('clearSession'),
    mode,
    selectedStudentId,
    noAccess: computed(() => false),
    canLoadWords: computed(() => true),
    canWriteWords: computed(() => false),
  };

  beforeEach(async () => {
    session.set({
      userId: '507f1f77bcf86cd799439011',
      email: 'u@test.com',
      firstName: 'Jane',
      lastName: 'Doe',
      roleNames: ['student'],
      showTutorMode: false,
      showStudentMode: true,
      defaultMode: 'student',
      students: [],
    });
    mode.set('student');
    selectedStudentId.set(null);
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: jasmine.createSpyObj('AuthService', ['logout']) },
        { provide: SessionContextService, useValue: mockSession },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('displayName should return User when no session', () => {
    session.set(null);
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.displayName).toBe('User');
  });

  it('displayName should return email when user has no name', () => {
    session.set({
      userId: '1',
      email: 'only@email.com',
      firstName: null,
      lastName: null,
      roleNames: ['student'],
      showTutorMode: false,
      showStudentMode: true,
      defaultMode: 'student',
      students: [],
    });
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.displayName).toBe('only@email.com');
  });

  it('displayName should return first and last name when set', () => {
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.displayName).toBe('Jane Doe');
  });

  it('logout should clear session and call authService.logout', () => {
    const auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    fixture.componentInstance.logout();
    expect(mockSession.clearSession).toHaveBeenCalled();
    expect(auth.logout).toHaveBeenCalled();
  });

  describe('tutor scoped links', () => {
    beforeEach(() => {
      session.set({
        userId: 't1',
        email: 'tutor@test.com',
        firstName: 'T',
        lastName: 'R',
        roleNames: ['tutor'],
        showTutorMode: true,
        showStudentMode: true,
        defaultMode: 'tutor',
        students: [{ _id: 'stu1', firstName: 'Ann', lastName: 'One', email: 'ann@test.com' }],
      });
      mode.set('tutor');
      selectedStudentId.set('stu1');
    });

    it('nav links use /student/:id paths when tutor mode is active', () => {
      fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const links = fixture.debugElement.queryAll(By.directive(RouterLink));
      expect(links.length).toBeGreaterThanOrEqual(3);
      const hrefs = links.map(l => l.injector.get(RouterLink).href);
      expect(hrefs.some(h => h?.includes('/student/stu1') && !h?.includes('/words'))).toBeTrue();
      expect(hrefs.some(h => h?.includes('/student/stu1/words'))).toBeTrue();
    });

    it('onModeChange to student navigates to / with self-vocab query', async () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
      fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      fixture.componentInstance.onModeChange('student');
      expect(router.navigate).toHaveBeenCalledWith(['/'], {
        replaceUrl: true,
        queryParams: { self: '1' },
        queryParamsHandling: '',
      });
    });

    it('onModeChange to tutor navigates to /student/:id', async () => {
      mode.set('student');
      selectedStudentId.set(null);
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
      fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      fixture.componentInstance.onModeChange('tutor');
      expect(router.navigate).toHaveBeenCalledWith(['/student', 'stu1'], {
        replaceUrl: true,
        queryParams: {},
      });
    });

    it('onStudentChange navigates to new student path', async () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
      fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      fixture.componentInstance.onStudentChange('stu1');
      expect(router.navigate).toHaveBeenCalledWith(['/student', 'stu1'], {
        replaceUrl: true,
        queryParams: {},
      });
    });
  });
});
