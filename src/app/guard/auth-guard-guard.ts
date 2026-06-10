import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auths } from '../service/auths';


export const authGuard: CanActivateFn = () => {
  const authService = inject(Auths);
  const router      = inject(Router);

  if (authService.isLoggedIn()) {
  
    router.navigate(['/']);
    return false;
  }

  return true;
};