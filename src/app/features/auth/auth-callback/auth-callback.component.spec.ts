import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { AuthCallbackComponent } from './auth-callback.component';

describe('AuthCallbackComponent', () => {
  let fixture: ComponentFixture<AuthCallbackComponent>;
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    authService = jasmine.createSpyObj('AuthService', ['setToken']);
    await TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: jasmine.createSpy('get').and.returnValue(null) } },
          },
        },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AuthCallbackComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('on token in query should setToken and navigate to /words', async () => {
    const getParam = jasmine.createSpy('get').and.callFake((k: string) => (k === 'token' ? 'jwt' : null));
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: getParam } } } },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
    const compFixture = TestBed.createComponent(AuthCallbackComponent);
    compFixture.detectChanges();
    expect(authService.setToken).toHaveBeenCalledWith('jwt');
    expect(router.navigate).toHaveBeenCalledWith(['/words']);
  });

  it('on error=unauthorized should navigate to / with query', async () => {
    const getParam = jasmine.createSpy('get').and.callFake((k: string) => (k === 'error' ? 'unauthorized' : null));
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: getParam } } } },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
    const compFixture = TestBed.createComponent(AuthCallbackComponent);
    compFixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/'], { queryParams: { error: 'unauthorized' } });
    expect(authService.setToken).not.toHaveBeenCalled();
  });

  it('on no token and no error should navigate to /', async () => {
    const getParam = jasmine.createSpy('get').and.returnValue(null);
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: getParam } } } },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
    const compFixture = TestBed.createComponent(AuthCallbackComponent);
    compFixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
