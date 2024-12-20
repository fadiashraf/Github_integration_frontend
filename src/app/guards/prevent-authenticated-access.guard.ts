import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { GithubAuthService } from '../services/github-auth.service';

export const PreventAuthenticatedAccessGuard: CanActivateFn = async (route, state) => {
  const githubService = inject(GithubAuthService);
  const router = inject(Router);

  const isConnected = githubService.isAuthenticatedSync()
  if (isConnected) {
    await router.navigate(['/']);
    return false;
  }

  return true;


};
