import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ZardButtonComponent, ZardIconComponent],
  templateUrl: './login.component.html',
  host: { class: 'block' },
})
export class LoginComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  protected readonly showAccessDenied = signal(false);

  ngOnInit(): void {
    const error = this.route.snapshot.queryParamMap.get('error');
    if (error === 'unauthorized') {
      this.showAccessDenied.set(true);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        queryParamsHandling: '',
      });
    }
  }

  login(): void {
    this.authService.loginWithGoogle();
  }
}
