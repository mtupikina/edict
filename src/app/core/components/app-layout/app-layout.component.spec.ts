import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { SessionContextService } from '../../services/session-context.service';
import { AppLayoutComponent } from './app-layout.component';

describe('AppLayoutComponent', () => {
  let fixture: ComponentFixture<AppLayoutComponent>;
  const loadSession = jasmine
    .createSpy('loadSession')
    .and.returnValue(Subscription.EMPTY);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppLayoutComponent, RouterOutlet],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { logout: jasmine.createSpy('logout') } },
        {
          provide: SessionContextService,
          useValue: {
            session: signal(null),
            loaded: signal(false),
            loadError: signal(false),
            loadSession,
            clearSession: () => {
              void 0;
            },
            mode: signal<'tutor' | 'student'>('student'),
            selectedStudentId: signal(null),
            routeSyncGeneration: signal(0),
            noAccess: computed(() => false),
            canLoadWords: computed(() => false),
            canWriteWords: computed(() => false),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AppLayoutComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(loadSession).toHaveBeenCalled();
  });
});
