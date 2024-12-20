import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GithubAuthService } from '../services/github-auth.service';

export const AuthGuard: CanActivateFn = async (route, state) => {
  const githubService = inject(GithubAuthService);
  const router = inject(Router);

  try {
    const isConnected = githubService.isAuthenticatedSync()

    if (!isConnected) {
      await router.navigate(['/auth']);
      return false;
    }
    return true;

  } catch (error) {
    console.error('Error in AuthGuard:', error);
    await router.navigate(['/auth']);
    return false;
  }
};
