import {
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { ZardInputDirective } from '@/shared/components/input';
import { ZardSelectImports } from '@/shared/components/select/select.imports';

import { SessionContextService } from '../../../core/services/session-context.service';
import { WordsService } from '../services/words.service';
import { Word } from '../models/word.model';
import { WordFormDialogComponent } from '../word-form-dialog/word-form-dialog.component';
import { WordListItemComponent } from '../word-list-item/word-list-item.component';

type SortByOption = 'word' | 'translation' | 'createdAt';
type OrderOption = 'asc' | 'desc';

@Component({
  selector: 'app-words-list',
  standalone: true,
  imports: [FormsModule, ScrollingModule, ZardInputDirective, ZardSelectImports, WordFormDialogComponent, WordListItemComponent],
  templateUrl: './words-list.component.html',
  host: { class: 'block' },
})
export class WordsListComponent {
  @ViewChild(CdkVirtualScrollViewport) private readonly viewportRef?: CdkVirtualScrollViewport;

  private readonly wordsService = inject(WordsService);
  private readonly sessionContext = inject(SessionContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTrigger$ = new Subject<void>();

  protected readonly words = signal<Word[]>([]);
  protected readonly nextCursor = signal<string | null>(null);
  protected readonly totalCount = signal<number | null>(null);
  protected readonly editingWord = signal<Word | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sortBy = signal<SortByOption>('createdAt');
  protected readonly order = signal<OrderOption>('desc');
  protected readonly search = signal('');

  protected readonly sortOptions: { sortBy: SortByOption; order: OrderOption; label: string }[] = [
    { sortBy: 'createdAt', order: 'desc', label: 'Date added (newest)' },
    { sortBy: 'createdAt', order: 'asc', label: 'Date added (oldest)' },
    { sortBy: 'word', order: 'asc', label: 'Word (A–Z)' },
    { sortBy: 'word', order: 'desc', label: 'Word (Z–A)' },
    { sortBy: 'translation', order: 'asc', label: 'Translation (A–Z)' },
    { sortBy: 'translation', order: 'desc', label: 'Translation (Z–A)' },
  ];

  /**
   * Same session key dedup as check-words: the effect can run twice while mode/studentId settle.
   */
  private lastWordsSessionKey: string | null = null;

  constructor() {
    this.searchTrigger$
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadFirst());

    effect(() => {
      this.sessionContext.mode();
      this.sessionContext.selectedStudentId();
      this.sessionContext.canLoadWords();
      if (!this.sessionContext.canLoadWords()) {
        untracked(() => {
          this.lastWordsSessionKey = null;
        });
        return;
      }
      untracked(() => this.loadFirstIfSessionContextChanged());
    });
  }

  private loadFirstIfSessionContextChanged(): void {
    const mode = this.sessionContext.mode();
    const sid = this.sessionContext.selectedStudentId();
    const key = `${mode}:${sid ?? ''}`;
    if (key === this.lastWordsSessionKey) {
      return;
    }
    this.lastWordsSessionKey = key;
    this.loadFirst();
  }

  protected isReadOnly(): boolean {
    return !this.sessionContext.canWriteWords();
  }

  setSort(sortBy: SortByOption, order: OrderOption): void {
    this.sortBy.set(sortBy);
    this.order.set(order);
    this.loadFirst();
  }

  protected onSortChange(value: string): void {
    const [s, o] = value.split(':');
    if (s && (o === 'asc' || o === 'desc')) {
      this.setSort(s as SortByOption, o as OrderOption);
    }
  }

  protected onSearchChange(value: string): void {
    this.search.set(value ?? '');
    this.searchTrigger$.next();
  }

  loadFirst(): void {
    this.loading.set(true);
    this.error.set(null);
    const searchTerm = this.search().trim() || undefined;
    this.wordsService
      .getPage(20, undefined, this.sortBy(), this.order(), searchTerm)
      .subscribe({
        next: (page) => {
          this.words.set(page.items);
          this.nextCursor.set(page.nextCursor);
          this.totalCount.set(page.totalCount);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.message ?? 'Failed to load words');
          this.loading.set(false);
        },
      });
  }

  loadMore(): void {
    const cursor = this.nextCursor();
    if (!cursor || this.loadingMore()) return;
    this.loadingMore.set(true);
    const searchTerm = this.search().trim() || undefined;
    this.wordsService
      .getPage(20, cursor, this.sortBy(), this.order(), searchTerm)
      .subscribe({
        next: (page) => {
          this.words.update((list) => [...list, ...page.items]);
          this.nextCursor.set(page.nextCursor);
          this.totalCount.set(page.totalCount);
          this.loadingMore.set(false);
        },
        error: () => this.loadingMore.set(false),
      });
  }

  protected onScrolledIndexChange(): void {
    if (!this.viewportRef || this.loadingMore() || !this.nextCursor()) return;
    const range = this.viewportRef.getRenderedRange();
    const total = this.words().length;
    if (range.end >= total - 5) {
      this.loadMore();
    }
  }

  protected trackByWordId(_index: number, word: Word): string {
    return word._id;
  }

  onWordDeleted(id: string): void {
    this.words.update((list) => list.filter((w) => w._id !== id));
  }

  onWordSaved(word: Word): void {
    void word;
    this.editingWord.set(null);
    this.loadFirst();
  }

  protected onDialogCancel(): void {
    this.editingWord.set(null);
  }
}
