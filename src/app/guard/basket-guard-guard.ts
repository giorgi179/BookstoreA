import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auths } from '../service/auths';

/** Guard: basket გვერდი მხოლოდ logged-in მომხმარებლებისთვის */
export const basketGuard: CanActivateFn = () => {
  const authService = inject(Auths);
  const router      = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/auth'], {
      queryParams: { error: 'basket-auth-required' },
    });
    return false;
  }

  return true;
};