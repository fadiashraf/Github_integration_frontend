import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  try {
    const token = localStorage.getItem('token');
    const modifiedReq = req.clone({
      setHeaders: token
        ? { Authorization: `Bearer ${token}` }
        : {},
      withCredentials: true,
    });

    return next(modifiedReq);
  } catch (error) {
    console.error('Error retrieving token:', error);
    return next(req);
  }
};
