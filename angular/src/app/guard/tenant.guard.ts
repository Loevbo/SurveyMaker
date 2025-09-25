import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStateService } from '@abp/ng.core';

export const tenantGuard: CanActivateFn = () => {
  const session = inject(SessionStateService);
  const router = inject(Router);
  return session.getTenant()?.id ? true : router.parseUrl('/');
};