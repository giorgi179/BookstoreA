import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { About } from './components/about/about';
import { Auth } from './components/auth/auth';
import { Basket } from './components/basket/basket';
import { Books } from './components/books/books';
import { Card } from './components/card/card';
import { Contact } from './components/contact/contact';
import { Profile } from './components/profile/profile';
import { Events } from './components/events/events';
import { authGuard } from './guard/auth-guard-guard';
import { basketGuard } from './guard/basket-guard-guard';

export const routes: Routes = [
  {
    path:'',
    component:Home
  },
    {
    path:'about',
    component:About
  },

    {
    path:'books',
    component:Books
  },
    {
    path:'card',
    component:Card
  },
    {
    path:'contact',
    component:Contact
  },
    {
    path:'events',
    component:Events
  },
    {
    path:'profile',
    component:Profile
  },
    {
    path: 'auth',
    loadComponent: () => import('./components/auth/auth').then(m => m.Auth),
    canActivate: [authGuard],  
  },
  {
    path: 'basket',
    loadComponent: () => import('./components/basket/basket').then(m => m.Basket),
    canActivate: [basketGuard],
  },
  {
    path: '',
    loadComponent: () => import('./components/home/home').then(m => m.Home),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
