import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations'; 
import { ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from './global-error-handler.service';
import { authInterceptor } from './interceptors/auth.interceptor';
import { httpErrorInterceptor } from './interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor, httpErrorInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
