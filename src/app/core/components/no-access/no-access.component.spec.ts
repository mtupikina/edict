import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthService } from '../../services/auth.service';
import { SessionContextService } from '../../services/session-context.service';
import { NoAccessComponent } from './no-access.component';

describe('NoAccessComponent', () => {
  let fixture: ComponentFixture<NoAccessComponent>;
  const mockAuth = { logout: jasmine.createSpy('logout') };
  const mockSession = { clearSession: jasmine.createSpy('clearSession') };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoAccessComponent],
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: SessionContextService, useValue: mockSession },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NoAccessComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should clear session and logout', () => {
    fixture.nativeElement.querySelector('button')?.click();
    expect(mockSession.clearSession).toHaveBeenCalled();
    expect(mockAuth.logout).toHaveBeenCalled();
  });
});
