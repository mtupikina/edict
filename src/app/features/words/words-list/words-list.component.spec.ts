import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Word } from '../models/word.model';
import { WordsService } from '../services/words.service';
import { WordsListComponent } from './words-list.component';

/** Test surface for protected/private members and signals. */
type WordsListTestHarness = WordsListComponent & {
  words: () => Word[] & { set: (v: Word[]) => void };
  nextCursor: () => string | null & { set: (v: string | null) => void };
  error: () => string | null;
  sortBy: () => string;
  order: () => string;
  search: () => string & { set: (v: string) => void };
  totalCount: () => number | null & { set: (v: number | null) => void };
  loadingMore: () => boolean & { set: (v: boolean) => void };
  setSort: (sortBy: string, order: string) => void;
  onSortChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  loadMore: () => void;
  onScrolledIndexChange: () => void;
  trackByWordId: (index: number, word: Word) => string;
};

function listHarness(instance: WordsListComponent): WordsListTestHarness {
  return instance as unknown as WordsListTestHarness;
}

describe('WordsListComponent', () => {
  let fixture: ComponentFixture<WordsListComponent>;
  let wordsService: jasmine.SpyObj<WordsService>;

  beforeEach(async () => {
    wordsService = jasmine.createSpyObj('WordsService', ['getPage']);
    wordsService.getPage.and.returnValue(of({ items: [], nextCursor: null, hasMore: false, totalCount: 0 }));
    await TestBed.configureTestingModule({
      imports: [WordsListComponent],
      providers: [{ provide: WordsService, useValue: wordsService }],
    }).compileComponents();
    fixture = TestBed.createComponent(WordsListComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load first page on init', () => {
    expect(wordsService.getPage).toHaveBeenCalledWith(20, undefined, 'createdAt', 'desc', undefined);
  });

  it('should set words and nextCursor on successful load', () => {
    const items: Word[] = [{ _id: '1', word: 'a' }];
    wordsService.getPage.and.returnValue(of({ items, nextCursor: 'c2', hasMore: true, totalCount: 1 }));
    fixture = TestBed.createComponent(WordsListComponent);
    fixture.detectChanges();
    const comp = listHarness(fixture.componentInstance);
    expect(comp.words()).toEqual(items);
    expect(comp.nextCursor()).toBe('c2');
  });

  it('should set error on load failure', () => {
    wordsService.getPage.and.returnValue(throwError(() => ({ message: 'err' })));
    fixture = TestBed.createComponent(WordsListComponent);
    fixture.detectChanges();
    expect(listHarness(fixture.componentInstance).error()).toBe('err');
  });

  it('should set generic error when error has no message', () => {
    wordsService.getPage.and.returnValue(throwError(() => ({})));
    fixture = TestBed.createComponent(WordsListComponent);
    fixture.detectChanges();
    expect(listHarness(fixture.componentInstance).error()).toBe('Failed to load words');
  });

  it('setSort should update sort and reload', () => {
    wordsService.getPage.calls.reset();
    listHarness(fixture.componentInstance).setSort('word', 'asc');
    const comp = listHarness(fixture.componentInstance);
    expect(comp.sortBy()).toBe('word');
    expect(comp.order()).toBe('asc');
    expect(wordsService.getPage).toHaveBeenCalledWith(20, undefined, 'word', 'asc', undefined);
  });

  it('onSortChange should parse value and setSort', () => {
    wordsService.getPage.calls.reset();
    listHarness(fixture.componentInstance).onSortChange('word:asc');
    expect(wordsService.getPage).toHaveBeenCalledWith(20, undefined, 'word', 'asc', undefined);
  });

  it('onSortChange should not setSort when value is invalid', () => {
    wordsService.getPage.calls.reset();
    listHarness(fixture.componentInstance).onSortChange('invalid');
    listHarness(fixture.componentInstance).onSortChange('word:invalid');
    expect(wordsService.getPage).not.toHaveBeenCalled();
  });

  it('loadMore should not call getPage when nextCursor is null', () => {
    wordsService.getPage.calls.reset();
    listHarness(fixture.componentInstance).nextCursor.set(null);
    listHarness(fixture.componentInstance).loadMore();
    expect(wordsService.getPage).not.toHaveBeenCalled();
  });

  it('loadMore should not call getPage when already loading more', () => {
    wordsService.getPage.and.returnValue(of({ items: [], nextCursor: null, hasMore: false, totalCount: 0 }));
    listHarness(fixture.componentInstance).nextCursor.set('c');
    listHarness(fixture.componentInstance).loadingMore.set(true);
    wordsService.getPage.calls.reset();
    listHarness(fixture.componentInstance).loadMore();
    expect(wordsService.getPage).not.toHaveBeenCalled();
  });

  it('loadMore should append page when cursor exists', () => {
    wordsService.getPage.and.returnValues(
      of({ items: [{ _id: '1', word: 'a' }], nextCursor: 'c2', hasMore: true, totalCount: 2 }),
      of({ items: [{ _id: '2', word: 'b' }], nextCursor: null, hasMore: false, totalCount: 2 }),
    );
    fixture = TestBed.createComponent(WordsListComponent);
    fixture.detectChanges();
    listHarness(fixture.componentInstance).loadMore();
    expect(listHarness(fixture.componentInstance).words().length).toBe(2);
  });

  it('loadMore on error should set loadingMore to false', () => {
    wordsService.getPage.and.returnValue(throwError(() => new Error('load more failed')));
    fixture = TestBed.createComponent(WordsListComponent);
    fixture.detectChanges();
    listHarness(fixture.componentInstance).nextCursor.set('c');
    listHarness(fixture.componentInstance).loadMore();
    expect(listHarness(fixture.componentInstance).loadingMore()).toBe(false);
  });

  it('onWordDeleted should remove word from list', () => {
    const comp = listHarness(fixture.componentInstance);
    comp.words.set([{ _id: '1', word: 'a' }, { _id: '2', word: 'b' }] as Word[]);
    fixture.componentInstance.onWordDeleted('1');
    expect(comp.words().length).toBe(1);
    expect(comp.words()[0]._id).toBe('2');
  });

  it('onWordSaved should reload first page', () => {
    wordsService.getPage.calls.reset();
    fixture.componentInstance.onWordSaved({ _id: '1', word: 'x' } as Word);
    expect(wordsService.getPage).toHaveBeenCalled();
  });

  it('onScrolledIndexChange should call loadMore when viewport range end is near list end', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ _id: String(i), word: `w${i}` } as Word));
    wordsService.getPage.and.returnValue(of({ items, nextCursor: 'cursor', hasMore: true, totalCount: 20 }));
    fixture = TestBed.createComponent(WordsListComponent);
    fixture.detectChanges();
    const comp = listHarness(fixture.componentInstance);
    comp.nextCursor.set('cursor');
    comp.words.set(items);
    wordsService.getPage.calls.reset();
    // Simulate viewport near end: range.end >= total - 5
    (fixture.componentInstance as unknown as { viewportRef?: { getRenderedRange: () => { end: number } } }).viewportRef = {
      getRenderedRange: () => ({ start: 0, end: 18 }),
    };
    comp.onScrolledIndexChange();
    expect(wordsService.getPage).toHaveBeenCalledWith(20, 'cursor', 'createdAt', 'desc', undefined);
  });

  it('onScrolledIndexChange should not call loadMore when viewportRef is undefined', () => {
    listHarness(fixture.componentInstance).nextCursor.set('c');
    wordsService.getPage.calls.reset();
    (fixture.componentInstance as unknown as { viewportRef?: unknown }).viewportRef = undefined;
    listHarness(fixture.componentInstance).onScrolledIndexChange();
    expect(wordsService.getPage).not.toHaveBeenCalled();
  });

  it('trackByWordId should return word _id', () => {
    const word = { _id: 'id1', word: 'test' } as Word;
    expect(listHarness(fixture.componentInstance).trackByWordId(0, word)).toBe('id1');
  });

  it('onSearchChange should set search and reload first page after debounce', fakeAsync(() => {
    wordsService.getPage.calls.reset();
    listHarness(fixture.componentInstance).onSearchChange('hello');
    expect(listHarness(fixture.componentInstance).search()).toBe('hello');
    expect(wordsService.getPage).not.toHaveBeenCalled();
    tick(300);
    expect(wordsService.getPage).toHaveBeenCalledWith(20, undefined, 'createdAt', 'desc', 'hello');
  }));

  it('loadFirst should pass trimmed search to getPage', () => {
    wordsService.getPage.and.returnValue(of({ items: [], nextCursor: null, hasMore: false, totalCount: 0 }));
    listHarness(fixture.componentInstance).search.set('  bar  ');
    wordsService.getPage.calls.reset();
    fixture.componentInstance.loadFirst();
    expect(wordsService.getPage).toHaveBeenCalledWith(20, undefined, 'createdAt', 'desc', 'bar');
  });
});
