import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { authGuard, loggedInGuard } from './auth.guard';

describe('authGuard', () => {
  let authService: { isAuthenticated: jasmine.Spy };
  let router: jasmine.SpyObj<Router>;
  const urlTree = {} as ReturnType<Router['createUrlTree']>;

  beforeEach(() => {
    authService = {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
    };
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue(urlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('should allow activation when authenticated', () => {
    authService.isAuthenticated.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to / when not authenticated', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toBe(urlTree);
  });
});

describe('loggedInGuard', () => {
  let authService: { isAuthenticated: jasmine.Spy };
  let router: jasmine.SpyObj<Router>;
  const urlTree = {} as ReturnType<Router['createUrlTree']>;

  beforeEach(() => {
    authService = {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
    };
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue(urlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('should allow activation when not authenticated', () => {
    const result = TestBed.runInInjectionContext(() =>
      loggedInGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to /words when authenticated', () => {
    authService.isAuthenticated.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() =>
      loggedInGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(router.createUrlTree).toHaveBeenCalledWith(['/words']);
    expect(result).toBe(urlTree);
  });
});
