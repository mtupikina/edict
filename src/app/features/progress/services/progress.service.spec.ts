import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HttpRequest } from '@angular/common/http';

import { ProgressService } from './progress.service';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl}/words/stats`;

describe('ProgressService', () => {
  let service: ProgressService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProgressService],
    });
    service = TestBed.inject(ProgressService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getQuizFrequency', () => {
    it('sends groupBy and skips empty optional params', () => {
      service.getQuizFrequency('week').subscribe();
      const req = httpMock.expectOne(
        (r: HttpRequest<unknown>) => r.url === `${BASE}/quiz-frequency`,
      );
      expect(req.request.params.get('groupBy')).toBe('week');
      expect(req.request.params.has('from')).toBeFalse();
      expect(req.request.params.has('to')).toBeFalse();
      expect(req.request.params.has('studentId')).toBeFalse();
      req.flush([]);
    });

    it('forwards from / to / studentId when provided', () => {
      service
        .getQuizFrequency('month', '2026-01-01', '2026-04-30', 's1')
        .subscribe();
      const req = httpMock.expectOne(
        (r: HttpRequest<unknown>) => r.url === `${BASE}/quiz-frequency`,
      );
      expect(req.request.params.get('from')).toBe('2026-01-01');
      expect(req.request.params.get('to')).toBe('2026-04-30');
      expect(req.request.params.get('studentId')).toBe('s1');
      req.flush([]);
    });
  });

  describe('getMasteryOverTime', () => {
    it('sends a request with no params when none are provided', () => {
      service.getMasteryOverTime().subscribe();
      const req = httpMock.expectOne(
        (r: HttpRequest<unknown>) => r.url === `${BASE}/mastery-over-time`,
      );
      expect(req.request.params.keys().length).toBe(0);
      req.flush([]);
    });

    it('forwards optional params when provided', () => {
      service.getMasteryOverTime('2026-01-01', '2026-04-30', 's1').subscribe();
      const req = httpMock.expectOne(
        (r: HttpRequest<unknown>) => r.url === `${BASE}/mastery-over-time`,
      );
      expect(req.request.params.get('from')).toBe('2026-01-01');
      expect(req.request.params.get('to')).toBe('2026-04-30');
      expect(req.request.params.get('studentId')).toBe('s1');
      req.flush([]);
    });
  });

  describe('getWordsOverTime', () => {
    it('hits the words-over-time endpoint and forwards params', () => {
      service.getWordsOverTime('2026-01-01', '2026-04-30', 's1').subscribe();
      const req = httpMock.expectOne(
        (r: HttpRequest<unknown>) => r.url === `${BASE}/words-over-time`,
      );
      expect(req.request.params.get('from')).toBe('2026-01-01');
      expect(req.request.params.get('to')).toBe('2026-04-30');
      expect(req.request.params.get('studentId')).toBe('s1');
      req.flush([]);
    });

    it('omits all params when not provided', () => {
      service.getWordsOverTime().subscribe();
      const req = httpMock.expectOne(
        (r: HttpRequest<unknown>) => r.url === `${BASE}/words-over-time`,
      );
      expect(req.request.params.keys().length).toBe(0);
      req.flush([]);
    });
  });

  describe('getPartsOfSpeech', () => {
    it('hits the parts-of-speech endpoint and forwards params', () => {
      service.getPartsOfSpeech('2026-01-01', '2026-04-30', 's1').subscribe();
      const req = httpMock.expectOne(
        (r: HttpRequest<unknown>) => r.url === `${BASE}/parts-of-speech`,
      );
      expect(req.request.params.get('from')).toBe('2026-01-01');
      expect(req.request.params.get('to')).toBe('2026-04-30');
      expect(req.request.params.get('studentId')).toBe('s1');
      req.flush([]);
    });

    it('omits params when not provided', () => {
      service.getPartsOfSpeech().subscribe();
      const req = httpMock.expectOne(
        (r: HttpRequest<unknown>) => r.url === `${BASE}/parts-of-speech`,
      );
      expect(req.request.params.keys().length).toBe(0);
      req.flush([]);
    });
  });

  describe('getQuizResults', () => {
    it('hits the quiz-results endpoint and forwards params', () => {
      service.getQuizResults('2026-01-01', '2026-04-30', 's1').subscribe();
      const req = httpMock.expectOne(
        (r: HttpRequest<unknown>) => r.url === `${BASE}/quiz-results`,
      );
      expect(req.request.params.get('from')).toBe('2026-01-01');
      expect(req.request.params.get('to')).toBe('2026-04-30');
      expect(req.request.params.get('studentId')).toBe('s1');
      req.flush([]);
    });

    it('omits params when not provided', () => {
      service.getQuizResults().subscribe();
      const req = httpMock.expectOne(
        (r: HttpRequest<unknown>) => r.url === `${BASE}/quiz-results`,
      );
      expect(req.request.params.keys().length).toBe(0);
      req.flush([]);
    });
  });

  describe('getProblematicWords', () => {
    it('always sends limit and forwards optional params', () => {
      service
        .getProblematicWords(5, '2026-01-01', '2026-04-30', 's1')
        .subscribe();
      const req = httpMock.expectOne(
        (r: HttpRequest<unknown>) => r.url === `${BASE}/problematic-words`,
      );
      expect(req.request.params.get('limit')).toBe('5');
      expect(req.request.params.get('from')).toBe('2026-01-01');
      expect(req.request.params.get('to')).toBe('2026-04-30');
      expect(req.request.params.get('studentId')).toBe('s1');
      req.flush([]);
    });

    it('only sends limit when no other params are provided', () => {
      service.getProblematicWords(10).subscribe();
      const req = httpMock.expectOne(
        (r: HttpRequest<unknown>) => r.url === `${BASE}/problematic-words`,
      );
      expect(req.request.params.get('limit')).toBe('10');
      expect(req.request.params.has('from')).toBeFalse();
      expect(req.request.params.has('to')).toBeFalse();
      expect(req.request.params.has('studentId')).toBeFalse();
      req.flush([]);
    });
  });
});
