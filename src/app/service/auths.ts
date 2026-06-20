import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginRequest, ResetPasswordRequest, TokenResponse } from '../controlers';


@Injectable({
  providedIn: 'root',
})
export class Auths {
  readonly apiUrl = 'https://bookapi-oc2p.onrender.com/api';
  readonly http = inject(HttpClient);

  readonly isLoggedIn = signal<boolean>(!!localStorage.getItem('userId'));

  register(user: any): Observable<any> {
    const payload = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      phone: user.phone ?? '',
      userUrl: '',
    };
    return this.http.post<any>(`${this.apiUrl}/User/register`, payload);
  }

  verify(id: number, code: string | null): Observable<any> {
    const params = new HttpParams().set('id', id.toString()).set('code', code ?? '');
    return this.http.post(`${this.apiUrl}/User/verify-user`, null, {
      params,
      responseType: 'text',
    });
  }

  userLogin(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/User/login`, credentials);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/User/forgot-password`,
      { email },
      {
        responseType: 'text',
      },
    );
  }

  resetPassword(data: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/User/reset-password`, data, {
      responseType: 'text',
    });
  }

  setToken(userId: number, token: string): void {
    localStorage.setItem('userId', userId.toString());
    localStorage.setItem('authToken', token);
    const payload = JSON.parse(atob(token.split('.')[1]));
    localStorage.setItem('email', payload.email);
    this.isLoggedIn.set(true); 
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  removeToken(): void {
    localStorage.removeItem('userId');
    localStorage.removeItem('authToken');
    this.isLoggedIn.set(false);
  }

  googleLogin(idToken: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/User/google-login`, { token: idToken });
  }
}
