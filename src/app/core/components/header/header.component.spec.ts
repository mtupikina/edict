import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from './header.component';
import { environment } from '../../../../environments/environment';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj('AuthService', ['logout']);
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    req.flush(null);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('displayName should return User when no user', () => {
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    req.flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(fixture.componentInstance.displayName).toBe('User');
  });

  it('displayName should return email when user has no name', () => {
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    req.flush({ email: 'u@test.com', firstName: null, lastName: null });
    fixture.detectChanges();
    expect(fixture.componentInstance.displayName).toBe('u@test.com');
  });

  it('displayName should return first and last name when set', () => {
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    req.flush({ email: 'u@test.com', firstName: 'Jane', lastName: 'Doe' });
    fixture.detectChanges();
    expect(fixture.componentInstance.displayName).toBe('Jane Doe');
  });

  it('displayName should return firstName only when lastName is null', () => {
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    req.flush({ email: 'u@test.com', firstName: 'Jane', lastName: null });
    fixture.detectChanges();
    expect(fixture.componentInstance.displayName).toBe('Jane');
  });

  it('displayName should return User when user has no name and no email', () => {
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    req.flush({ email: null, firstName: null, lastName: null });
    fixture.detectChanges();
    expect(fixture.componentInstance.displayName).toBe('User');
  });

  it('logout should call authService.logout', () => {
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/auth/me`).flush({ email: 'u@test.com' });
    fixture.componentInstance.logout();
    expect(authService.logout).toHaveBeenCalled();
  });
});
