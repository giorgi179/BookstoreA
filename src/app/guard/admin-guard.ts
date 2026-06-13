import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminLoginService } from '../service/admin-login';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AdminLoginService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  router.navigate(['/mtavari-login']);
  return false;
};