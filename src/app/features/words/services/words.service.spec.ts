import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { WordsService } from './words.service';
import { Word, WordsPage } from '../models/word.model';

import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl}/words`;

describe('WordsService', () => {
  let service: WordsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WordsService],
    });
    service = TestBed.inject(WordsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getPage should request with default params', () => {
    const page: WordsPage = { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
    service.getPage().subscribe((data) => expect(data).toEqual(page));
    const req = httpMock.expectOne((r) => r.url === BASE && r.params.get('limit') === '20');
    expect(req.request.params.get('sortBy')).toBe('createdAt');
    expect(req.request.params.get('order')).toBe('desc');
    expect(req.request.params.get('search')).toBe('');
    req.flush(page);
  });

  it('getPage should include cursor when provided', () => {
    service.getPage(10, 'cursor123', 'word', 'asc').subscribe();
    const req = httpMock.expectOne((r) => r.url === BASE && r.params.get('cursor') === 'cursor123');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('sortBy')).toBe('word');
    expect(req.request.params.get('order')).toBe('asc');
    req.flush({ items: [], nextCursor: null, hasMore: false, totalCount: 0 });
  });

  it('getPage should include search param when provided', () => {
    service.getPage(20, undefined, 'createdAt', 'desc', 'hello').subscribe();
    const req = httpMock.expectOne((r) => r.url === BASE && r.params.get('search') === 'hello');
    expect(req.request.params.get('search')).toBe('hello');
    req.flush({ items: [], nextCursor: null, hasMore: false, totalCount: 0 });
  });

  it('getPage should send empty search param when search is empty or whitespace', () => {
    service.getPage(20, undefined, 'createdAt', 'desc', '  ').subscribe();
    const req = httpMock.expectOne((r) => r.url.startsWith(BASE) && r.params.get('search') === '');
    expect(req.request.params.get('search')).toBe('');
    req.flush({ items: [], nextCursor: null, hasMore: false, totalCount: 0 });
  });

  it('getOne should GET word by id', () => {
    const word: Word = { _id: '1', word: 'test' };
    service.getOne('1').subscribe((data) => expect(data).toEqual(word));
    const req = httpMock.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(word);
  });

  it('create should POST body', () => {
    const body = { word: 'new', translation: 'neu' };
    const created: Word = { _id: '2', ...body };
    service.create(body).subscribe((data) => expect(data).toEqual(created));
    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(created);
  });

  it('update should PATCH by id', () => {
    const body = { translation: 'updated' };
    const updated: Word = { _id: '1', word: 'test', translation: 'updated' };
    service.update('1', body).subscribe((data) => expect(data).toEqual(updated));
    const req = httpMock.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(body);
    req.flush(updated);
  });

  it('delete should DELETE by id', () => {
    service.delete('1').subscribe((data) => expect(data).toEqual({ message: 'ok' }));
    const req = httpMock.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'ok' });
  });
});
