import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSelectImports } from '@/shared/components/select/select.imports';

import type { AuthSession } from '../../models/auth-session.model';
import { AuthService } from '../../services/auth.service';
import { SessionContextService } from '../../services/session-context.service';
import {
  SELF_VOCAB_QUERY_PARAM,
  SELF_VOCAB_QUERY_VALUE,
  urlIndicatesSelfVocabLayout,
} from '../app-layout/session-default-route.util';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ...ZardSelectImports,
  ],
  templateUrl: './header.component.html',
  host: { class: 'block' },
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly session = inject(SessionContextService);

  get displayName(): string {
    const s = this.session.session();
    if (!s) return 'User';
    if (s.firstName || s.lastName) {
      return [s.firstName, s.lastName].filter(Boolean).join(' ').trim();
    }
    return s.email ?? 'User';
  }

  onModeChange(value: string): void {
    if (value !== 'tutor' && value !== 'student') {
      return;
    }
    const onWords = this.isOnWordsPath();
    if (value === 'student') {
      void this.router.navigate(onWords ? ['/words'] : ['/'], {
        replaceUrl: true,
        queryParams: { [SELF_VOCAB_QUERY_PARAM]: SELF_VOCAB_QUERY_VALUE },
        queryParamsHandling: '',
      });
      return;
    }
    const s = this.session.session();
    const sid =
      this.session.selectedStudentId() ?? s?.students[0]?._id ?? null;
    if (sid) {
      void this.router.navigate(onWords ? ['/student', sid, 'words'] : ['/student', sid], {
        replaceUrl: true,
        queryParams: {},
      });
    } else {
      void this.router.navigate(['/'], { replaceUrl: true, queryParams: {} });
    }
  }

  onStudentChange(value: string): void {
    const id = value || null;
    if (!id || this.session.mode() !== 'tutor') {
      return;
    }
    const onWords = this.isOnWordsPath();
    void this.router.navigate(onWords ? ['/student', id, 'words'] : ['/student', id], {
      replaceUrl: true,
      queryParams: {},
    });
  }

  /** Check words home: `/` or `/student/:id`. */
  protected checkWordsLink(): string[] {
    return this.tutorHomePath(false);
  }

  /** Preserve `?self=1` on nav links when dual-mode user is on self vocabulary URLs. */
  protected selfVocabNavQueryParams(): Record<string, string> | undefined {
    if (!this.shouldPreserveSelfVocabOnNavLinks()) {
      return undefined;
    }
    return { [SELF_VOCAB_QUERY_PARAM]: SELF_VOCAB_QUERY_VALUE };
  }

  /** Words list: `/words` or `/student/:id/words`. */
  protected wordsListLink(): string[] {
    return this.tutorHomePath(true);
  }

  private shouldPreserveSelfVocabOnNavLinks(): boolean {
    const s = this.session.session();
    if (!s?.showTutorMode || !s.showStudentMode || this.session.mode() !== 'student') {
      return false;
    }
    return urlIndicatesSelfVocabLayout(this.router.url);
  }

  private tutorHomePath(words: boolean): string[] {
    const s = this.session.session();
    const id = this.session.selectedStudentId();
    if (this.session.mode() === 'tutor' && s?.showTutorMode && id) {
      return words ? ['/student', id, 'words'] : ['/student', id];
    }
    return words ? ['/words'] : ['/'];
  }

  private isOnWordsPath(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/words' || /\/student\/[^/]+\/words$/.test(url);
  }

  /** True when mode and/or student dropdowns are shown (tutor flows). */
  protected hasTutorToolbar(sess: AuthSession): boolean {
    if (!sess.showTutorMode) return false;
    if (sess.showStudentMode) return true;
    return this.session.mode() === 'tutor' && sess.students.length > 1;
  }

  logout(): void {
    this.session.clearSession();
    this.authService.logout();
  }
}
