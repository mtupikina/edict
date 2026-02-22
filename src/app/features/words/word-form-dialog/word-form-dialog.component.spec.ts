import type { FormGroup } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import type { Signal } from '@angular/core';

import { Word } from '../models/word.model';
import { WordsService } from '../services/words.service';
import type { WordFormValue } from './word-form.utils';
import { WordFormDialogComponent } from './word-form-dialog.component';

/** Test surface for protected/private members. */
interface WordFormDialogTestHarness {
  showAddForm: Signal<boolean> & { set: (v: boolean) => void };
  error: Signal<string | null> & { set: (v: string | null) => void };
  form: FormGroup;
  openAdd(): void;
  close(): void;
  save(): void;
  getControlError(controlName: keyof WordFormValue): string | null;
  showPluralField: boolean;
  showVerbFormsField: boolean;
}

function harness(instance: WordFormDialogComponent): WordFormDialogTestHarness {
  return instance as unknown as WordFormDialogTestHarness;
}

describe('WordFormDialogComponent', () => {
  let fixture: ComponentFixture<WordFormDialogComponent>;
  let wordsService: jasmine.SpyObj<WordsService>;

  beforeEach(async () => {
    wordsService = jasmine.createSpyObj('WordsService', ['create', 'update']);
    wordsService.create.and.returnValue(of({ _id: '1', word: 'new' } as Word));
    wordsService.update.and.returnValue(of({ _id: '1', word: 'updated' } as Word));
    await TestBed.configureTestingModule({
      imports: [WordFormDialogComponent],
      providers: [{ provide: WordsService, useValue: wordsService }],
    }).compileComponents();
    fixture = TestBed.createComponent(WordFormDialogComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('openAdd should reset form and show add form', () => {
    harness(fixture.componentInstance).showAddForm.set(false);
    harness(fixture.componentInstance).openAdd();
    expect(harness(fixture.componentInstance).showAddForm()).toBe(true);
    expect(harness(fixture.componentInstance).error()).toBeNull();
  });

  it('close should hide add form and emit dialogCancel', () => {
    let cancelled = false;
    fixture.componentInstance.dialogCancel.subscribe(() => (cancelled = true));
    harness(fixture.componentInstance).showAddForm.set(true);
    harness(fixture.componentInstance).close();
    expect(harness(fixture.componentInstance).showAddForm()).toBe(false);
    expect(cancelled).toBe(true);
  });

  it('save with invalid form should markAllAsTouched', () => {
    harness(fixture.componentInstance).openAdd();
    harness(fixture.componentInstance).save();
    expect(harness(fixture.componentInstance).form.get('word')?.touched).toBe(true);
  });

  it('save in add mode should call create and emit saved', () => {
    let emitted: Word | undefined;
    fixture.componentInstance.saved.subscribe((w) => (emitted = w));
    harness(fixture.componentInstance).openAdd();
    harness(fixture.componentInstance).form.patchValue({ word: 'new word' });
    harness(fixture.componentInstance).save();
    expect(wordsService.create).toHaveBeenCalled();
    expect(emitted?.word).toBe('new');
    expect(harness(fixture.componentInstance).showAddForm()).toBe(false);
  });

  it('save in edit mode should call update and emit saved', () => {
    let emitted: Word | undefined;
    fixture.componentInstance.saved.subscribe((w) => (emitted = w));
    fixture.componentRef.setInput('word', { _id: '1', word: 'existing' } as Word);
    fixture.detectChanges();
    harness(fixture.componentInstance).form.patchValue({ word: 'updated word' });
    harness(fixture.componentInstance).save();
    expect(wordsService.update).toHaveBeenCalledWith('1', jasmine.any(Object));
    expect(emitted?.word).toBe('updated');
  });

  it('save on API error should set error signal', () => {
    wordsService.create.and.returnValue(throwError(() => ({ error: { message: 'Bad request' } })));
    harness(fixture.componentInstance).openAdd();
    harness(fixture.componentInstance).form.patchValue({ word: 'x' });
    harness(fixture.componentInstance).save();
    expect(harness(fixture.componentInstance).error()).toBe('Bad request');
  });

  it('save on API error with array message should join messages', () => {
    wordsService.create.and.returnValue(
      throwError(() => ({ error: { message: ['First', 'Second'] } })),
    );
    harness(fixture.componentInstance).openAdd();
    harness(fixture.componentInstance).form.patchValue({ word: 'x' });
    harness(fixture.componentInstance).save();
    expect(harness(fixture.componentInstance).error()).toBe('First Second');
  });

  it('save on API error with top-level message should use it', () => {
    wordsService.create.and.returnValue(throwError(() => ({ message: 'Network error' })));
    harness(fixture.componentInstance).openAdd();
    harness(fixture.componentInstance).form.patchValue({ word: 'x' });
    harness(fixture.componentInstance).save();
    expect(harness(fixture.componentInstance).error()).toBe('Network error');
  });

  it('getControlError returns message for invalid touched control', () => {
    harness(fixture.componentInstance).form.get('word')?.setValue('');
    harness(fixture.componentInstance).form.get('word')?.markAsTouched();
    expect(harness(fixture.componentInstance).getControlError('word')).toBe('Word is required');
  });

  it('getControlError returns apiError when it matches field apiErrorPattern', () => {
    harness(fixture.componentInstance).error.set('word is required');
    expect(harness(fixture.componentInstance).getControlError('word')).toBe('word is required');
  });

  it('getControlError returns null when control is valid', () => {
    harness(fixture.componentInstance).form.patchValue({ word: 'x' });
    expect(harness(fixture.componentInstance).getControlError('word')).toBeNull();
  });

  it('showPluralField is true when partOfSpeech is n', () => {
    harness(fixture.componentInstance).form.patchValue({ partOfSpeech: 'n' });
    expect(harness(fixture.componentInstance).showPluralField).toBe(true);
  });

  it('showPluralField is true when partOfSpeech is adj', () => {
    harness(fixture.componentInstance).form.patchValue({ partOfSpeech: 'adj' });
    expect(harness(fixture.componentInstance).showPluralField).toBe(true);
  });

  it('showVerbFormsField is true when partOfSpeech is v', () => {
    harness(fixture.componentInstance).form.patchValue({ partOfSpeech: 'v' });
    expect(harness(fixture.componentInstance).showVerbFormsField).toBe(true);
  });

  it('showVerbFormsField is true when partOfSpeech is ph v', () => {
    harness(fixture.componentInstance).form.patchValue({ partOfSpeech: 'ph v' });
    expect(harness(fixture.componentInstance).showVerbFormsField).toBe(true);
  });
});
