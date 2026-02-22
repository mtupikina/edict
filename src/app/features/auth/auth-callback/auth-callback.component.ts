import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  templateUrl: './auth-callback.component.html',
})
export class AuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const error = this.route.snapshot.queryParamMap.get('error');

    if (error === 'unauthorized') {
      this.router.navigate(['/'], { queryParams: { error: 'unauthorized' } });
      return;
    }

    if (token) {
      this.authService.setToken(token);
      this.router.navigate(['/words']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
