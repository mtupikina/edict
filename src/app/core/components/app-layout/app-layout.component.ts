import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { HeaderComponent } from '../header/header.component';
import { NoAccessComponent } from '../no-access/no-access.component';
import { SessionContextService } from '../../services/session-context.service';
import { shouldNavigateToDefaultTutorRoute } from './session-default-route.util';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NoAccessComponent],
  templateUrl: './app-layout.component.html',
  host: { class: 'block' },
})
export class AppLayoutComponent {
  protected readonly session = inject(SessionContextService);
  private readonly router = inject(Router);

  constructor() {
    this.session.loadSession();

    /**
     * Default landing: tutor scope with the first student when tutor mode is available.
     * If tutor mode is not available (no flag or no tutees), stay on self routes `/` and `/words`.
     * Dual-mode users on self vocabulary use `?self=1` so this does not override them.
     */
    effect(() => {
      void this.session.routeSyncGeneration();
      if (!this.session.loaded() || this.session.loadError()) {
        return;
      }
      const sess = this.session.session();
      if (!sess) {
        return;
      }
      const students = sess.students;
      if (
        !shouldNavigateToDefaultTutorRoute({
          fullUrl: this.router.url,
          showTutorMode: sess.showTutorMode,
          showStudentMode: sess.showStudentMode,
          studentCount: students.length,
        })
      ) {
        return;
      }
      const first = students[0]._id;
      const path = this.router.url.split('?')[0];
      const target =
        path === '/words' ? ['/student', first, 'words'] : ['/student', first];
      void this.router.navigate(target, { replaceUrl: true, queryParams: {} });
    });
  }
}
