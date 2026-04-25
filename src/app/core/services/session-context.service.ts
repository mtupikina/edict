import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { AuthSession } from '../models/auth-session.model';

/** Maps GET /auth/me JSON to `AuthSession`, using safe defaults for missing or invalid fields. */
function coerceAuthSession(raw: unknown): AuthSession {
  if (!raw || typeof raw !== 'object') {
    return {
      userId: null,
      email: '',
      firstName: null,
      lastName: null,
      roleNames: [],
      showTutorMode: false,
      showStudentMode: false,
      defaultMode: 'student',
      students: [],
    };
  }
  const o = raw as Record<string, unknown>;
  const email = typeof o['email'] === 'string' ? o['email'] : '';
  const rolesRaw = o['roleNames'];
  const roleNames = Array.isArray(rolesRaw)
    ? rolesRaw.filter((r): r is string => typeof r === 'string')
    : [];
  const studentsRaw = o['students'];
  const students: AuthSession['students'] = Array.isArray(studentsRaw)
    ? studentsRaw.filter(
        (x): x is AuthSession['students'][number] =>
          !!x &&
          typeof x === 'object' &&
          '_id' in x &&
          typeof (x as { _id: unknown })._id === 'string',
      )
    : [];

  return {
    userId: o['userId'] != null ? String(o['userId']) : null,
    email,
    firstName: (o['firstName'] as string | null) ?? null,
    lastName: (o['lastName'] as string | null) ?? null,
    roleNames,
    showTutorMode: o['showTutorMode'] === true,
    showStudentMode: o['showStudentMode'] === true,
    defaultMode: o['defaultMode'] === 'tutor' ? 'tutor' : 'student',
    students,
  };
}

@Injectable({ providedIn: 'root' })
export class SessionContextService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly session = signal<AuthSession | null>(null);
  readonly loaded = signal(false);
  readonly loadError = signal(false);
  /** Derived from the URL: `/student/:id` → tutor, otherwise student (self vocabulary). */
  readonly mode = signal<'tutor' | 'student'>('student');
  /** Set from `studentId` route param when URL matches `/student/:studentId/...`. */
  readonly selectedStudentId = signal<string | null>(null);
  /**
   * Bumped whenever `syncModeFromUrl` runs so effects can depend on URL (path + query) changes,
   * not only on `/auth/me` payload updates.
   */
  readonly routeSyncGeneration = signal(0);

  readonly noAccess = computed(() => {
    const s = this.session();
    return !!s && !s.showTutorMode && !s.showStudentMode;
  });

  readonly canLoadWords = computed(() => {
    if (!this.loaded() || this.loadError()) return false;
    if (this.noAccess()) return false;
    return true;
  });

  /** Tutor viewing a tutee: full word/quiz write access. */
  readonly canWriteWords = computed(() => {
    if (!this.canLoadWords()) return false;
    if (this.mode() === 'student') return false;
    return this.mode() === 'tutor' && !!this.selectedStudentId();
  });

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.syncModeFromUrl(this.router.url));
  }

  /**
   * Maps URL path to tutor/student mode and selected tutee id.
   * `/student/:studentId`, `/student/:studentId/words`, `/student/:studentId/progress` → tutor + id;
   * `/`, `/words`, `/progress` → student.
   */
  syncModeFromUrl(url: string): void {
    const path = url.split('?')[0];
    const m = path.match(/^\/student\/([^/]+)(?:\/(words|progress))?$/);
    if (m) {
      this.mode.set('tutor');
      this.selectedStudentId.set(m[1]);
    } else {
      this.mode.set('student');
      this.selectedStudentId.set(null);
    }
    this.routeSyncGeneration.update((g) => g + 1);
  }

  loadSession(): Subscription {
    this.loadError.set(false);
    return this.http.get<AuthSession>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (raw) => {
        const data = coerceAuthSession(raw);
        this.session.set(data);
        this.syncModeFromUrl(this.router.url);
        this.loaded.set(true);
      },
      error: () => {
        this.loadError.set(true);
        this.loaded.set(true);
      },
    });
  }

  clearSession(): void {
    this.session.set(null);
    this.loaded.set(false);
    this.loadError.set(false);
    this.mode.set('student');
    this.selectedStudentId.set(null);
    this.routeSyncGeneration.set(0);
  }
}
