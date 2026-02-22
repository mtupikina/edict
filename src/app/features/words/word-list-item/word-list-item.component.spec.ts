import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Word } from '../models/word.model';
import { WordsService } from '../services/words.service';
import { WordListItemComponent } from './word-list-item.component';

describe('WordListItemComponent', () => {
  let fixture: ComponentFixture<WordListItemComponent>;
  let wordsService: jasmine.SpyObj<WordsService>;

  beforeEach(async () => {
    wordsService = jasmine.createSpyObj('WordsService', ['delete']);
    wordsService.delete.and.returnValue(of({ message: 'ok' }));
    await TestBed.configureTestingModule({
      imports: [WordListItemComponent],
      providers: [{ provide: WordsService, useValue: wordsService }],
    }).compileComponents();
    fixture = TestBed.createComponent(WordListItemComponent);
    fixture.componentRef.setInput('word', { _id: '1', word: 'test' } as Word);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('openEdit should set showEdit true', () => {
    fixture.componentInstance.openEdit();
    expect((fixture.componentInstance as unknown as { showEdit: boolean; confirmDelete: boolean }).showEdit).toBe(true);
  });

  it('closeEdit should set showEdit false', () => {
    (fixture.componentInstance as unknown as { showEdit: boolean; confirmDelete: boolean }).showEdit = true;
    fixture.componentInstance.closeEdit();
    expect((fixture.componentInstance as unknown as { showEdit: boolean; confirmDelete: boolean }).showEdit).toBe(false);
  });

  it('onEdited should emit edited and close edit', () => {
    const w: Word = { _id: '1', word: 'updated' };
    let emitted: Word | undefined;
    fixture.componentInstance.edited.subscribe((v) => (emitted = v));
    (fixture.componentInstance as unknown as { showEdit: boolean; confirmDelete: boolean }).showEdit = true;
    fixture.componentInstance.onEdited(w);
    expect(emitted).toEqual(w);
    expect((fixture.componentInstance as unknown as { showEdit: boolean; confirmDelete: boolean }).showEdit).toBe(false);
  });

  it('deleteWord should call service delete and emit deleted', () => {
    let emittedId: string | undefined;
    fixture.componentInstance.deleted.subscribe((id) => (emittedId = id));
    (fixture.componentInstance as unknown as { showEdit: boolean; confirmDelete: boolean }).confirmDelete = true;
    fixture.componentInstance.deleteWord();
    expect(wordsService.delete).toHaveBeenCalledWith('1');
    expect(emittedId).toBe('1');
    expect((fixture.componentInstance as unknown as { showEdit: boolean; confirmDelete: boolean }).confirmDelete).toBe(false);
  });

  it('deleteWord on error should reset confirmDelete', () => {
    wordsService.delete.and.returnValue(throwError(() => new Error('err')));
    (fixture.componentInstance as unknown as { showEdit: boolean; confirmDelete: boolean }).confirmDelete = true;
    fixture.componentInstance.deleteWord();
    expect((fixture.componentInstance as unknown as { showEdit: boolean; confirmDelete: boolean }).confirmDelete).toBe(false);
  });
});
