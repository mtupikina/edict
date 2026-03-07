import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardSwitchComponent } from '@/shared/components/switch';

import {
  QuizWord,
  ToVerifyWord,
  WordVerifyUpdate,
} from './models/check-words.model';
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

  constructor() {
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
