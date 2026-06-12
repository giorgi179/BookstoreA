import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { About } from './components/about/about';
import { Books } from './components/books/books';
import { Card } from './components/card/card';
import { Contact } from './components/contact/contact';
import { Profile } from './components/profile/profile';
import { Events } from './components/events/events';
import { authGuard } from './guard/auth-guard-guard';
import { basketGuard } from './guard/basket-guard-guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'about', component: About },
  { path: 'books', component: Books },
  { path: 'card', component: Card },
  { path: 'contact', component: Contact },
  { path: 'events', component: Events },
  { path: 'profile', component: Profile },
  {
    path: 'auth',
    loadComponent: () => import('./components/auth/auth').then((m) => m.Auth),
    canActivate: [authGuard],
  },
  {
    path: 'basket',
    loadComponent: () => import('./components/basket/basket').then((m) => m.BasketComponent),
    canActivate: [basketGuard],
  },
  {
    path: 'accessibility',
    loadComponent: () => import('./pages/accessibility/accessibility').then((m) => m.Accessibility),
  },
  { path: 'terms', loadComponent: () => import('./pages/terms/terms').then((m) => m.Terms) },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/privacy/privacy').then((m) => m.Privacy),
  },
  {
    path: 'cookies',
    loadComponent: () => import('./pages/cookies/cookies').then((m) => m.Cookies),
  },
  { path: '**', redirectTo: '' },
];
