import { ComponentFixture, TestBed } from '@angular/core/testing';
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
  loadingMore: () => boolean & { set: (v: boolean) => void };
  setSort: (sortBy: string, order: string) => void;
  onSortChange: (value: string) => void;
  loadMore: () => void;
};

function listHarness(instance: WordsListComponent): WordsListTestHarness {
  return instance as unknown as WordsListTestHarness;
}

describe('WordsListComponent', () => {
  let fixture: ComponentFixture<WordsListComponent>;
  let wordsService: jasmine.SpyObj<WordsService>;

  beforeEach(async () => {
    wordsService = jasmine.createSpyObj('WordsService', ['getPage']);
    wordsService.getPage.and.returnValue(of({ items: [], nextCursor: null, hasMore: false }));
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
    expect(wordsService.getPage).toHaveBeenCalledWith(20, undefined, 'createdAt', 'desc');
  });

  it('should set words and nextCursor on successful load', () => {
    const items: Word[] = [{ _id: '1', word: 'a' }];
    wordsService.getPage.and.returnValue(of({ items, nextCursor: 'c2', hasMore: true }));
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
    expect(wordsService.getPage).toHaveBeenCalledWith(20, undefined, 'word', 'asc');
  });

  it('onSortChange should parse value and setSort', () => {
    wordsService.getPage.calls.reset();
    listHarness(fixture.componentInstance).onSortChange('word:asc');
    expect(wordsService.getPage).toHaveBeenCalledWith(20, undefined, 'word', 'asc');
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
    wordsService.getPage.and.returnValue(of({ items: [], nextCursor: null, hasMore: false }));
    listHarness(fixture.componentInstance).nextCursor.set('c');
    listHarness(fixture.componentInstance).loadingMore.set(true);
    wordsService.getPage.calls.reset();
    listHarness(fixture.componentInstance).loadMore();
    expect(wordsService.getPage).not.toHaveBeenCalled();
  });

  it('loadMore should append page when cursor exists', () => {
    wordsService.getPage.and.returnValues(
      of({ items: [{ _id: '1', word: 'a' }], nextCursor: 'c2', hasMore: true }),
      of({ items: [{ _id: '2', word: 'b' }], nextCursor: null, hasMore: false }),
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

  it('onScroll should call loadMore', () => {
    wordsService.getPage.and.returnValue(of({ items: [], nextCursor: null, hasMore: false }));
    listHarness(fixture.componentInstance).nextCursor.set('cursor');
    fixture.componentInstance.onScroll();
    expect(wordsService.getPage).toHaveBeenCalledWith(20, 'cursor', 'createdAt', 'desc');
  });
});
