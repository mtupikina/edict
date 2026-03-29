import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { ToVerifyWord } from '../models/check-words.model';
import { CheckWordsService } from './check-words.service';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl}/words`;

describe('CheckWordsService', () => {
  let service: CheckWordsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CheckWordsService],
    });
    service = TestBed.inject(CheckWordsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getToVerifyList should GET verify/list', () => {
    const list = [{ _id: '1', word: 'hello', translation: 'привіт', toVerifyNextTime: true }];
    service.getToVerifyList().subscribe((data) => expect(data).toEqual(list));
    const req = httpMock.expectOne(`${BASE}/verify/list`);
    expect(req.request.method).toBe('GET');
    req.flush(list);
  });

  it('getToVerifyList should issue a new GET on each call', () => {
    const list: ToVerifyWord[] = [];
    const received: ToVerifyWord[][] = [];
    service.getToVerifyList().subscribe((data) => received.push(data));
    httpMock.expectOne(`${BASE}/verify/list`).flush(list);
    service.getToVerifyList().subscribe((data) => received.push(data));
    httpMock.expectOne(`${BASE}/verify/list`).flush(list);
    expect(received.length).toBe(2);
    expect(received).toEqual([list, list]);
  });

  it('generateQuiz should POST verify/generate with count', () => {
    const quiz = [{ _id: '2', word: 'world', translation: 'світ' }];
    service.generateQuiz(15).subscribe((data) => expect(data).toEqual(quiz));
    const req = httpMock.expectOne(`${BASE}/verify/generate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ count: 15 });
    req.flush(quiz);
  });

  it('submitQuiz should POST verify/submit with updates', () => {
    const updates = [
      {
        wordId: '1',
        word: 'hello',
        translation: 'привіт',
        canEToU: true,
        canUToE: false,
        toVerifyNextTime: true,
      },
    ];
    service.submitQuiz(updates).subscribe();
    const req = httpMock.expectOne(`${BASE}/verify/submit`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ updates });
    req.flush(null);
  });
});
