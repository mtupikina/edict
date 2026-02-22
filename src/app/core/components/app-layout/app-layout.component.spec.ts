import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, RouterOutlet } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { AppLayoutComponent } from './app-layout.component';

describe('AppLayoutComponent', () => {
  let fixture: ComponentFixture<AppLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppLayoutComponent, RouterOutlet],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: { logout: jasmine.createSpy('logout') } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AppLayoutComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
