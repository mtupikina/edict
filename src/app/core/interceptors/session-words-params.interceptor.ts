import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { SessionContextService } from '../services/session-context.service';

/** Tutee id when the app URL is `/student/:id` or `/student/:id/words`. */
function tuteeIdFromAppUrl(routerUrl: string): string | null {
  const path = routerUrl.split('?')[0];
  const m = path.match(/^\/student\/([^/]+)(?:\/(words))?$/);
  return m ? m[1] : null;
}

export const sessionWordsParamsInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionContextService);
  const router = inject(Router);
  const base = environment.apiUrl;
  if (!req.url.startsWith(`${base}/words`)) {
    return next(req);
  }
  if (req.params.has('studentId')) {
    return next(req);
  }

  const sess = session.session();
  const sidFromUrl = tuteeIdFromAppUrl(router.url);
  if (sidFromUrl && sess?.showTutorMode === true) {
    return next(req.clone({ setParams: { studentId: sidFromUrl } }));
  }

  const mode = session.mode();
  const showTutor = sess?.showTutorMode === true;
  const tuteeId =
    showTutor && mode === 'tutor' ? session.selectedStudentId() : null;
  if (tuteeId) {
    return next(req.clone({ setParams: { studentId: tuteeId } }));
  }

  const selfId =
    showTutor &&
    mode === 'student' &&
    typeof sess?.userId === 'string' &&
    sess.userId.length > 0
      ? sess.userId
      : null;
  if (selfId) {
    return next(req.clone({ setParams: { studentId: selfId } }));
  }

  return next(req);
};
