import { Component, inject } from '@angular/core';

import { ZardButtonComponent } from '@/shared/components/button';

import { AuthService } from '../../services/auth.service';
import { SessionContextService } from '../../services/session-context.service';

@Component({
  selector: 'app-no-access',
  standalone: true,
  imports: [ZardButtonComponent],
  templateUrl: './no-access.component.html',
  host: { class: 'block' },
})
export class NoAccessComponent {
  private readonly authService = inject(AuthService);
  private readonly sessionContext = inject(SessionContextService);

  logout(): void {
    this.sessionContext.clearSession();
    this.authService.logout();
  }
}
