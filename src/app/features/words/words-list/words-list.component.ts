import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';

import { ZardSelectImports } from '@/shared/components/select/select.imports';

import { WordsService } from '../services/words.service';
import { Word } from '../models/word.model';
import { WordFormDialogComponent } from '../word-form-dialog/word-form-dialog.component';
import { WordListItemComponent } from '../word-list-item/word-list-item.component';

type SortByOption = 'word' | 'translation' | 'createdAt';
type OrderOption = 'asc' | 'desc';

@Component({
  selector: 'app-words-list',
  standalone: true,
  imports: [FormsModule, ScrollingModule, ZardSelectImports, WordFormDialogComponent, WordListItemComponent],
  templateUrl: './words-list.component.html',
  host: { class: 'block' },
})
export class WordsListComponent implements OnInit {
  @ViewChild(CdkVirtualScrollViewport) private readonly viewportRef?: CdkVirtualScrollViewport;

  private readonly wordsService = inject(WordsService);
  protected readonly words = signal<Word[]>([]);
  protected readonly nextCursor = signal<string | null>(null);
  protected readonly editingWord = signal<Word | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sortBy = signal<SortByOption>('createdAt');
  protected readonly order = signal<OrderOption>('desc');

  protected readonly sortOptions: { sortBy: SortByOption; order: OrderOption; label: string }[] = [
    { sortBy: 'createdAt', order: 'desc', label: 'Date added (newest)' },
    { sortBy: 'createdAt', order: 'asc', label: 'Date added (oldest)' },
    { sortBy: 'word', order: 'asc', label: 'Word (A–Z)' },
    { sortBy: 'word', order: 'desc', label: 'Word (Z–A)' },
    { sortBy: 'translation', order: 'asc', label: 'Translation (A–Z)' },
    { sortBy: 'translation', order: 'desc', label: 'Translation (Z–A)' },
  ];

  ngOnInit(): void {
    this.loadFirst();
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

  loadFirst(): void {
    this.loading.set(true);
    this.error.set(null);
    this.wordsService
      .getPage(20, undefined, this.sortBy(), this.order())
      .subscribe({
        next: (page) => {
          this.words.set(page.items);
          this.nextCursor.set(page.nextCursor);
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
    this.wordsService
      .getPage(20, cursor, this.sortBy(), this.order())
      .subscribe({
        next: (page) => {
          this.words.update((list) => [...list, ...page.items]);
          this.nextCursor.set(page.nextCursor);
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
