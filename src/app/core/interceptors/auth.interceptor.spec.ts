import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['getToken', 'clearToken']);
    authService.getToken.and.returnValue('test-token');
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header for api requests when token exists', () => {
    const client = TestBed.inject(HttpClient);
    client.get(`${environment.apiUrl}/words`).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/words`);
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('should not add Authorization for non-api requests', () => {
    const client = TestBed.inject(HttpClient);
    client.get('https://other.com/api').subscribe();
    const req = httpMock.expectOne('https://other.com/api');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should not add Authorization when no token', () => {
    authService.getToken.and.returnValue(null);
    const client = TestBed.inject(HttpClient);
    client.get(`${environment.apiUrl}/words`).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/words`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('on 401 should clear token and navigate to /', () => {
    const client = TestBed.inject(HttpClient);
    client.get(`${environment.apiUrl}/words`).subscribe({
      error: () => {
        /* expected in test */
      },
    });
    const req = httpMock.expectOne(`${environment.apiUrl}/words`);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(authService.clearToken).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('on non-401 error should not clear token', () => {
    const client = TestBed.inject(HttpClient);
    client.get(`${environment.apiUrl}/words`).subscribe({
      error: () => {
        /* expected in test */
      },
    });
    const req = httpMock.expectOne(`${environment.apiUrl}/words`);
    req.flush(null, { status: 500, statusText: 'Server Error' });
    expect(authService.clearToken).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
