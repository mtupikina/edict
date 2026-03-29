import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionContextService } from '../services/session-context.service';

/** Activates `/student/:studentId/...` only for tutors with a valid tutee id. */
export const studentScopeGuard: CanActivateFn = (route, state) => {
  const session = inject(SessionContextService);
  const router = inject(Router);
  const id = route.paramMap.get('studentId');
  if (!id) {
    return router.createUrlTree(['/']);
  }
  if (!session.loaded()) {
    return true;
  }
  const s = session.session();
  const isWords = /\/student\/[^/]+\/words(\?|$)/.test(state.url);

  if (!s?.showTutorMode) {
    return router.createUrlTree(isWords ? ['/words'] : ['/']);
  }

  if (!s.students.some(st => st._id === id)) {
    const fallback = s.students[0]?._id;
    if (!fallback) {
      return router.createUrlTree(['/']);
    }
    return router.createUrlTree(isWords ? ['/student', fallback, 'words'] : ['/student', fallback]);
  }

  return true;
};
