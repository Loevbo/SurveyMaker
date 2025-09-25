import { RoutesService, SessionStateService, eLayoutType } from '@abp/ng.core';
import { inject, provideAppInitializer } from '@angular/core';

export const APP_ROUTE_PROVIDER = [
  provideAppInitializer(() => {
    configureRoutes();
  }),
];

function configureRoutes() {
  const routes = inject(RoutesService);
  const session = inject(SessionStateService);

  const isTenant = !!session.getTenant()?.id;

  routes.add([
      {
        path: '/',
        name: '::Menu:Home',
        iconClass: 'fas fa-home',
        order: 1,
        layout: eLayoutType.application,
      },
      ...(
        isTenant ? [{
        path: '/survey',
        name: 'Survey',
        iconClass: 'fas fa-book',
        layout: eLayoutType.application,
      }] : []
      ),
  ]);
}
