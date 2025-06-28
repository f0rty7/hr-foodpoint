import { HttpInterceptorFn, HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Global HTTP interceptor for handling requests and responses
 */
export const httpInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Get the base URL from environment
  const baseUrl = environment.apiUrl;

  // Clone the request and add the base URL if it's not an absolute URL
  const modifiedReq = !req.url.startsWith('http') ?
    req.clone({
      url: `${baseUrl}${req.url}`,
      setHeaders: {
        // Add any default headers here
        'Content-Type': 'application/json',
      }
    }) : req;

  // Handle the request and catch any errors
  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle different types of errors here
      let errorMessage = 'An unknown error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        errorMessage = error.error?.message || error.message || errorMessage;
      }

      // You can add error logging service here
      console.error('HTTP Error:', errorMessage);

      return throwError(() => new Error(errorMessage));
    })
  );
};