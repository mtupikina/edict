import { computed, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Subscription } from 'rxjs';
import { of, throwError } from 'rxjs';

import { Router } from '@angular/router';

import type { AuthSession } from '../../core/models/auth-session.model';
import { SessionContextService } from '../../core/services/session-context.service';
import { CheckWordsComponent } from './check-words.component';

function sessionMock(canWrite = true): Partial<SessionContextService> {
  return {
    session: signal(null),
    loaded: signal(true),
    loadError: signal(false),
    loadSession: () => Subscription.EMPTY,
    clearSession: () => {
      void 0;
    },
    mode: signal<'tutor' | 'student'>('student'),
    selectedStudentId: signal(null),
    routeSyncGeneration: signal(0),
    noAccess: computed(() => false),
    canLoadWords: computed(() => true),
    canWriteWords: computed(() => canWrite),
  };
}
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
        { provide: SessionContextService, useValue: sessionMock() },
        { provide: Router, useValue: { url: '/' } },
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

  describe('tutor default redirect from /', () => {
    let sessionSig: WritableSignal<AuthSession | null>;
    let routeGen: WritableSignal<number>;
    let routerState: { url: string };

    beforeEach(async () => {
      TestBed.resetTestingModule();

      const checkWordsSpy = jasmine.createSpyObj('CheckWordsService', [
        'getToVerifyList',
        'generateQuiz',
        'submitQuiz',
      ]);
      const wordsSpy = jasmine.createSpyObj('WordsService', ['update']);
      checkWordsSpy.getToVerifyList.and.returnValue(of(toVerifyList));
      checkWordsSpy.generateQuiz.and.returnValue(of(quizWords));
      checkWordsSpy.submitQuiz.and.returnValue(of(undefined));

      sessionSig = signal<AuthSession | null>({
        userId: 'tutor-user',
        email: 't@test.com',
        firstName: null,
        lastName: null,
        roleNames: ['tutor'],
        showTutorMode: true,
        showStudentMode: true,
        defaultMode: 'tutor',
        students: [{ _id: 'stu1', firstName: 'A', lastName: 'B', email: 'a@b.com' }],
      });
      routeGen = signal(0);
      routerState = { url: '/' };

      await TestBed.configureTestingModule({
        imports: [CheckWordsComponent, HttpClientTestingModule],
        providers: [
          { provide: CheckWordsService, useValue: checkWordsSpy },
          { provide: WordsService, useValue: wordsSpy },
          {
            provide: SessionContextService,
            useValue: {
              session: sessionSig,
              loaded: signal(true),
              loadError: signal(false),
              loadSession: () => Subscription.EMPTY,
              clearSession: () => {
                void 0;
              },
              mode: signal<'tutor' | 'student'>('student'),
              selectedStudentId: signal<string | null>(null),
              routeSyncGeneration: routeGen,
              noAccess: computed(() => false),
              canLoadWords: computed(() => true),
              canWriteWords: computed(() => true),
            },
          },
          {
            provide: Router,
            useValue: {
              get url() {
                return routerState.url;
              },
            },
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(CheckWordsComponent);
      component = fixture.componentInstance;
      checkWordsService = TestBed.inject(
        CheckWordsService,
      ) as jasmine.SpyObj<CheckWordsService>;
      fixture.detectChanges();
    });

    it('does not fetch verify list on / while layout will redirect to tutee URL', () => {
      expect(checkWordsService.getToVerifyList).not.toHaveBeenCalled();
    });

    it('fetches verify list once after URL is /student/:id', () => {
      expect(checkWordsService.getToVerifyList).not.toHaveBeenCalled();
      routerState.url = '/student/stu1';
      routeGen.update((n) => n + 1);
      fixture.detectChanges();
      expect(checkWordsService.getToVerifyList).toHaveBeenCalledTimes(1);
    });
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

  it('should call wordsService.update when word field toggle is changed', () => {
    const updatedWord: Word = {
      _id: '1',
      word: 'hello',
      translation: 'привіт',
      toVerifyNextTime: false,
    };
    wordsService.update.and.returnValue(of(updatedWord));
    component.onWordFieldToggle(toVerifyList[0], 'toVerifyNextTime');
    expect(wordsService.update).toHaveBeenCalledWith('1', {
      toVerifyNextTime: false,
    });
  });

  it('should call wordsService.update when canEToU toggle is changed', () => {
    const updatedWord: Word = {
      _id: '1',
      word: 'hello',
      translation: 'привіт',
      canEToU: false,
    };
    wordsService.update.and.returnValue(of(updatedWord));
    component.onWordFieldToggle(
      { ...toVerifyList[0], canEToU: true },
      'canEToU',
      false,
    );
    expect(wordsService.update).toHaveBeenCalledWith('1', { canEToU: false });
  });

  it('should call wordsService.update when canUToE toggle is changed', () => {
    const updatedWord: Word = {
      _id: '1',
      word: 'hello',
      translation: 'привіт',
      canUToE: true,
    };
    wordsService.update.and.returnValue(of(updatedWord));
    component.onWordFieldToggle(
      { ...toVerifyList[0], canUToE: false },
      'canUToE',
      true,
    );
    expect(wordsService.update).toHaveBeenCalledWith('1', { canUToE: true });
  });

  it('should submit quiz and clear list on success', () => {
    component['quizWords'].set(quizWords);
    component.submitQuiz();
    expect(checkWordsService.submitQuiz).toHaveBeenCalledWith(
      quizWords.map((w) => ({
        wordId: w._id,
        word: w.word,
        ...(w.translation !== undefined && w.translation !== ''
          ? { translation: w.translation }
          : {}),
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

  it('hasWordsToPrint is true when to-verify list is loaded', () => {
    expect(component['hasWordsToPrint']()).toBe(true);
  });

  it('printCurrentWords opens a window and prints current list', () => {
    jasmine.clock().install();
    try {
      const printSpy = jasmine.createSpy('print');
      const fakeDoc = {
        open: jasmine.createSpy('open'),
        write: jasmine.createSpy('write'),
        close: jasmine.createSpy('close'),
      };
      const fakeWin = {
        document: fakeDoc,
        focus: jasmine.createSpy('focus'),
        print: printSpy,
      };
      spyOn(window, 'open').and.returnValue(fakeWin as unknown as Window);

      component['printCurrentWords']();

      expect(window.open).toHaveBeenCalledWith('', '_blank');
      expect(fakeDoc.write).toHaveBeenCalled();
      expect(fakeDoc.close).toHaveBeenCalled();
      expect(fakeWin.focus).toHaveBeenCalled();
      jasmine.clock().tick(0);
      expect(printSpy).toHaveBeenCalled();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('printCurrentWords skips when there are no words', () => {
    component['quizWords'].set([]);
    component['toVerifyList'].set([]);
    const openSpy = spyOn(window, 'open');
    component['printCurrentWords']();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('printCurrentWords does not throw when popup is blocked', () => {
    spyOn(window, 'open').and.returnValue(null);
    expect(() => component['printCurrentWords']()).not.toThrow();
    expect(window.open).toHaveBeenCalled();
  });
});
