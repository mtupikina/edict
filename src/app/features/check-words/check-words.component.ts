import { DatePipe } from '@angular/common';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardSwitchComponent } from '@/shared/components/switch';

import {
  QuizWord,
  ToVerifyWord,
  WordVerifyUpdate,
} from './models/check-words.model';
import { shouldNavigateToDefaultTutorRoute } from '../../core/components/app-layout/session-default-route.util';
import { SessionContextService } from '../../core/services/session-context.service';
import { CheckWordsService } from './services/check-words.service';
import { WordsService } from '../words/services/words.service';

@Component({
  selector: 'app-check-words',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardSwitchComponent,
  ],
  templateUrl: './check-words.component.html',
  host: { class: 'block' },
})
export class CheckWordsComponent {
  private readonly checkWordsService = inject(CheckWordsService);
  private readonly wordsService = inject(WordsService);
  protected readonly sessionContext = inject(SessionContextService);
  private readonly router = inject(Router);

  protected toVerifyList = signal<ToVerifyWord[]>([]);
  protected quizWords = signal<QuizWord[]>([]);
  protected count = signal<number>(50);
  protected wordsVisible = signal(true);
  protected translationsVisible = signal(true);
  protected loadingToVerify = signal(false);
  protected loadingQuiz = signal(false);
  protected submitting = signal(false);
  protected error = signal<string | null>(null);
  /** Keys of masked word/translation that are revealed by tap (for mobile). */
  protected revealedKeys = signal<Set<string>>(new Set());

  /**
   * Avoids duplicate GETs when the session effect re-runs in the same context (e.g. `canLoadWords`
   * flips true and `selectedStudentId` updates one tick apart).
   */
  private lastToVerifySessionKey: string | null = null;

  constructor() {
    effect(() => {
      this.sessionContext.session();
      this.sessionContext.routeSyncGeneration();
      this.sessionContext.mode();
      this.sessionContext.selectedStudentId();
      this.sessionContext.canLoadWords();
      if (!this.sessionContext.canLoadWords()) {
        untracked(() => {
          this.lastToVerifySessionKey = null;
        });
        return;
      }
      untracked(() => this.loadToVerifyListIfSessionContextChanged());
    });
  }

  /**
   * Aligns dedup key with words API scope: on `/student/:id` routes, tutor scope follows the
   * URL so we do not briefly treat the view as "self" before `syncModeFromUrl` runs.
   */
  private toVerifyLoadContextKey(): string {
    const sess = this.sessionContext.session();
    const path = this.router.url.split('?')[0];
    const m = path.match(/^\/student\/([^/]+)(?:\/(words))?$/);
    if (m && sess?.showTutorMode === true) {
      return `tutor:${m[1]}`;
    }
    const mode = this.sessionContext.mode();
    const sid = this.sessionContext.selectedStudentId();
    return `${mode}:${sid ?? ''}`;
  }

  /**
   * When session loads on `/` or `/words`, app layout immediately redirects tutors to
   * `/student/:firstId`. Skip verify-list until that navigation finishes to avoid a stray
   * self-scope request before the URL matches tutor scope.
   */
  private shouldSkipVerifyLoadPendingTutorRedirect(): boolean {
    const sess = this.sessionContext.session();
    if (!sess) {
      return false;
    }
    return shouldNavigateToDefaultTutorRoute({
      fullUrl: this.router.url,
      showTutorMode: sess.showTutorMode,
      showStudentMode: sess.showStudentMode,
      studentCount: sess.students.length,
    });
  }

  /** Loads from session-driven effect only; skips if load context unchanged. */
  private loadToVerifyListIfSessionContextChanged(): void {
    if (this.shouldSkipVerifyLoadPendingTutorRedirect()) {
      return;
    }
    const key = this.toVerifyLoadContextKey();
    if (key === this.lastToVerifySessionKey) {
      return;
    }
    this.lastToVerifySessionKey = key;
    this.loadToVerifyList();
  }

  loadToVerifyList(): void {
    this.loadingToVerify.set(true);
    this.error.set(null);
    this.checkWordsService.getToVerifyList().subscribe({
      next: (list) => {
        this.toVerifyList.set(list);
        this.loadingToVerify.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load list');
        this.loadingToVerify.set(false);
      },
    });
  }

  onWordFieldToggle(
    word: ToVerifyWord,
    field: 'canEToU' | 'canUToE' | 'toVerifyNextTime',
    newValue?: boolean,
  ): void {
    const value = newValue !== undefined ? newValue : !word[field];
    this.wordsService
      .update(word._id, { [field]: value })
      .subscribe({
        next: () => {
          this.toVerifyList.update((list) =>
            list.map((w) =>
              w._id === word._id ? { ...w, [field]: value } : w,
            ),
          );
        },
        error: (err) => {
          this.error.set(err?.message ?? 'Failed to update');
        },
      });
  }

  generateQuiz(): void {
    const n = Math.max(1, Math.min(100, this.count()));
    this.loadingQuiz.set(true);
    this.error.set(null);
    this.checkWordsService.generateQuiz(n).subscribe({
      next: (words) => {
        this.quizWords.set(words);
        this.loadingQuiz.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to generate quiz');
        this.loadingQuiz.set(false);
      },
    });
  }

  setQuizWordField(
    wordId: string,
    field: 'canEToU' | 'canUToE' | 'toVerifyNextTime',
    value: boolean,
  ): void {
    this.quizWords.update((list) =>
      list.map((w) =>
        w._id === wordId ? { ...w, [field]: value } : w,
      ),
    );
  }

  toggleReveal(key: string): void {
    this.revealedKeys.update((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  submitQuiz(): void {
    const words = this.quizWords();
    if (words.length === 0) return;
    const updates: WordVerifyUpdate[] = words.map((w) => ({
      wordId: w._id,
      word: w.word,
      ...(w.translation !== undefined && w.translation !== ''
        ? { translation: w.translation }
        : {}),
      canEToU: w.canEToU ?? false,
      canUToE: w.canUToE ?? false,
      toVerifyNextTime: w.toVerifyNextTime ?? false,
    }));
    this.submitting.set(true);
    this.error.set(null);
    this.checkWordsService.submitQuiz(updates).subscribe({
      next: () => {
        this.quizWords.set([]);
        this.loadToVerifyList();
        this.submitting.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to submit');
        this.submitting.set(false);
      },
    });
  }
}
