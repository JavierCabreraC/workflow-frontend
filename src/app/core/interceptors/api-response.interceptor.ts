import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';

export const apiResponseInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  return next(req).pipe(
    map(event => {
      if (
        event instanceof HttpResponse &&
        event.body !== null &&
        typeof event.body === 'object' &&
        'data' in event.body &&
        'success' in event.body
      ) {
        return event.clone({ body: (event.body as { data: unknown }).data });
      }
      return event;
    })
  );
};
