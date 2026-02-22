import { Routes } from '@angular/router';
import { authGuard, loggedInGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    canActivate: [loggedInGuard],
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/auth-callback/auth-callback.component').then(
        (m) => m.AuthCallbackComponent,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/components/app-layout/app-layout.component').then(
        (m) => m.AppLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      {
        path: 'words',
        loadComponent: () =>
          import('./features/words/words-list/words-list.component').then(
            (m) => m.WordsListComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
