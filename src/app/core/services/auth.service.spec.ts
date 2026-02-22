import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { AuthService, WINDOW_LOCATION } from './auth.service';

import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  let localStorageFake: Record<string, string>;
  let fakeLocation: { href: string };

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree']);
    localStorageFake = {};
    fakeLocation = { href: '' };
    spyOn(localStorage, 'getItem').and.callFake((key: string) => localStorageFake[key] ?? null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageFake[key] = value;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete localStorageFake[key];
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: router },
        { provide: WINDOW_LOCATION, useValue: fakeLocation },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getToken returns current token', () => {
    service.setToken('abc');
    expect(service.getToken()).toBe('abc');
  });

  it('setToken stores token and updates signal', () => {
    service.setToken('xyz');
    expect(localStorage.setItem).toHaveBeenCalledWith('edict_token', 'xyz');
    expect(service.getToken()).toBe('xyz');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('clearToken removes token and updates signal', () => {
    service.setToken('t');
    service.clearToken();
    expect(localStorage.removeItem).toHaveBeenCalledWith('edict_token');
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('isAuthenticated is true when token exists', () => {
    service.setToken('t');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('isAuthenticated is false when no token', () => {
    service.clearToken();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('loginWithGoogle sets location.href to api auth/google', () => {
    service.loginWithGoogle();
    expect(fakeLocation.href).toBe(`${environment.apiUrl}/auth/google`);
  });

  it('logout clears token and navigates to /', () => {
    service.setToken('t');
    service.logout();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    req.flush({});
    expect(localStorage.removeItem).toHaveBeenCalledWith('edict_token');
    expect(service.getToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('logout when token exists calls POST auth/logout', () => {
    service.setToken('t');
    service.logout();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('logout when no token does not call http', () => {
    service.clearToken();
    service.logout();
    httpMock.expectNone(`${environment.apiUrl}/auth/logout`);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
