import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';

import { AuthService } from '../../services/auth.service';
import { environment } from '../../../../environments/environment';

interface MeResponse {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, ZardButtonComponent, ZardIconComponent],
  templateUrl: './header.component.html',
  host: { class: 'block' },
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  protected readonly user = signal<MeResponse | null>(null);

  constructor() {
    this.http.get<MeResponse>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (data) => this.user.set(data),
      error: () => this.user.set(null),
    });
  }

  get displayName(): string {
    const u = this.user();
    if (!u) return 'User';
    if (u.firstName || u.lastName) {
      return [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    }
    return u.email ?? 'User';
  }

  logout(): void {
    this.authService.logout();
  }
}
