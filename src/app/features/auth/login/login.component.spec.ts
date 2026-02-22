import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    authService = jasmine.createSpyObj('AuthService', ['loginWithGoogle']);
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should set showAccessDenied and clear query when error is unauthorized', async () => {
    const getParam = jasmine.createSpy('get').and.returnValue('unauthorized');
    const route = { snapshot: { queryParamMap: { get: getParam } } };
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
    const compFixture = TestBed.createComponent(LoginComponent);
    compFixture.detectChanges();
    const accessDeniedEl = compFixture.nativeElement.querySelector('p.text-red-600');
    expect(accessDeniedEl?.textContent?.trim()).toContain('Access denied.');
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: {},
      queryParamsHandling: '',
    } as unknown as NavigationExtras);
  });

  it('login() should call authService.loginWithGoogle', () => {
    fixture.componentInstance.login();
    expect(authService.loginWithGoogle).toHaveBeenCalled();
  });
});
