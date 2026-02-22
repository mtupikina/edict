import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'edict_token';

export const WINDOW_LOCATION = new InjectionToken<{ href: string }>(
  'WINDOW_LOCATION',
  { providedIn: 'root', factory: () => (typeof window !== 'undefined' ? window.location : { href: '' }) },
);

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly location = inject(WINDOW_LOCATION);
  private readonly tokenSignal = signal<string | null>(this.getStoredToken());
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  getToken(): string | null {
    return this.tokenSignal();
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.tokenSignal.set(token);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.tokenSignal.set(null);
  }

  loginWithGoogle(): void {
    this.location.href = `${environment.apiUrl}/auth/google`;
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
    }
    this.clearToken();
    this.router.navigate(['/']);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
