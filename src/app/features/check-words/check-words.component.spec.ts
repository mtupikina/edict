import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { CheckWordsComponent } from './check-words.component';
import { CheckWordsService } from './services/check-words.service';
import { WordsService } from '../words/services/words.service';
import { ToVerifyWord, QuizWord } from './models/check-words.model';
import { Word } from '../words/models/word.model';

describe('CheckWordsComponent', () => {
  let component: CheckWordsComponent;
  let fixture: ComponentFixture<CheckWordsComponent>;
  let checkWordsService: jasmine.SpyObj<CheckWordsService>;
  let wordsService: jasmine.SpyObj<WordsService>;

  const toVerifyList: ToVerifyWord[] = [
    {
      _id: '1',
      word: 'hello',
      translation: 'привіт',
      toVerifyNextTime: true,
    },
  ];
  const quizWords: QuizWord[] = [
    {
      _id: '2',
      word: 'world',
      translation: 'світ',
      canEToU: false,
      canUToE: false,
    },
  ];

  beforeEach(async () => {
    const checkWordsSpy = jasmine.createSpyObj('CheckWordsService', [
      'getToVerifyList',
      'generateQuiz',
      'submitQuiz',
    ]);
    const wordsSpy = jasmine.createSpyObj('WordsService', ['update']);
    checkWordsSpy.getToVerifyList.and.returnValue(of(toVerifyList));
    checkWordsSpy.generateQuiz.and.returnValue(of(quizWords));
    checkWordsSpy.submitQuiz.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [CheckWordsComponent, HttpClientTestingModule],
      providers: [
        { provide: CheckWordsService, useValue: checkWordsSpy },
        { provide: WordsService, useValue: wordsSpy },
      ],
    }).compileComponents();

    checkWordsService = TestBed.inject(
      CheckWordsService,
    ) as jasmine.SpyObj<CheckWordsService>;
    wordsService = TestBed.inject(WordsService) as jasmine.SpyObj<WordsService>;
    fixture = TestBed.createComponent(CheckWordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load to-verify list on init', () => {
    expect(checkWordsService.getToVerifyList).toHaveBeenCalled();
    expect(component['toVerifyList']()).toEqual(toVerifyList);
  });

  it('should generate quiz when generateQuiz is called', () => {
    component['count'].set(5);
    component.generateQuiz();
    expect(checkWordsService.generateQuiz).toHaveBeenCalledWith(5);
    expect(component['quizWords']()).toEqual(quizWords);
  });

  it('should set quiz word field', () => {
    component['quizWords'].set([{ ...quizWords[0] }]);
    component.setQuizWordField('2', 'canEToU', true);
    expect(component['quizWords']()[0].canEToU).toBe(true);
  });

  it('should call wordsService.update when to-verify toggle is changed', () => {
    const updatedWord: Word = {
      _id: '1',
      word: 'hello',
      translation: 'привіт',
      toVerifyNextTime: false,
    };
    wordsService.update.and.returnValue(of(updatedWord));
    component.onToVerifyToggle(toVerifyList[0], 'toVerifyNextTime');
    expect(wordsService.update).toHaveBeenCalledWith('1', {
      toVerifyNextTime: false,
    });
  });

  it('should submit quiz and clear list on success', () => {
    component['quizWords'].set(quizWords);
    component.submitQuiz();
    expect(checkWordsService.submitQuiz).toHaveBeenCalledWith(
      quizWords.map((w) => ({
        wordId: w._id,
        canEToU: w.canEToU ?? false,
        canUToE: w.canUToE ?? false,
        toVerifyNextTime: w.toVerifyNextTime ?? false,
      })),
    );
    expect(component['quizWords']()).toEqual([]);
  });

  it('should set error when getToVerifyList fails', () => {
    checkWordsService.getToVerifyList.calls.reset();
    checkWordsService.getToVerifyList.and.returnValue(
      throwError(() => ({ message: 'Network error' })),
    );
    component.loadToVerifyList();
    expect(component['error']()).toBe('Network error');
  });
});
