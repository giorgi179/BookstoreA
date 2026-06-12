import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  BookOrder,
  Payment,
  PayRequest,
  SaveCardRequest,
  UpdateProfileRequest,
  UserProfile,
} from '../controlers';

import { map } from 'rxjs/operators';
import { CardFormData } from '../controlers';

const BASE_USER = 'https://bookapi-h00v.onrender.com/api/User';
const BASE_PAYMENT = 'https://bookapi-h00v.onrender.com/api/Payment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  // ── Auth helpers ────────────────────────────────────────────────────────────

  private get token(): string {
    return localStorage.getItem('authToken') ?? '';
  }

  private get email(): string {
    return localStorage.getItem('email') ?? '';
  }

  private get userId(): number {
    return Number(localStorage.getItem('userId') ?? 0);
  }

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.token}` });
  }

  private assertAuth(): Observable<never> | null {
    if (!this.token || !this.userId) {
      return throwError(() => new Error('User is not authenticated.'));
    }
    return null;
  }

  // ── User ────────────────────────────────────────────────────────────────────

  /** GET /api/User/get-user?email=... */
  getUser(): Observable<UserProfile> {
    const authErr = this.assertAuth();
    if (authErr) return authErr;
    const params = new HttpParams().set('email', this.email);
    return this.http
      .get<UserProfile>(`${BASE_USER}/get-user`, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  /** GET /api/User/get-user-{id} */
  getUserById(id: number): Observable<UserProfile> {
    const authErr = this.assertAuth();
    if (authErr) return authErr;
    return this.http
      .get<UserProfile>(`${BASE_USER}/get-user-${id}`, { headers: this.authHeaders })
      .pipe(catchError(this.handleError));
  }

  /** PUT /api/User/update-profile */
  updateProfile(data: { firstName: string; lastName: string; phone: string }): Observable<void> {
    const authErr = this.assertAuth();
    if (authErr) return authErr;
    const body: UpdateProfileRequest = {
      userId: this.userId,
      fullName: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
      phone: data.phone,
    };
    return this.http
      .put<void>(`${BASE_USER}/update-profile`, body, { headers: this.authHeaders })
      .pipe(catchError(this.handleError));
  }

  /** GET /api/User/get-photo?email=... */
  getPhoto(): Observable<string> {
    const authErr = this.assertAuth();
    if (authErr) return authErr as Observable<never>;
    const params = new HttpParams().set('email', this.email);
    return this.http
      .get(`${BASE_USER}/get-photo`, {
        headers: this.authHeaders,
        params,
        responseType: 'text',
      })
      .pipe(
        map((url) => url?.replace('http://', 'https://')), // ← ეს დაამატე
        catchError(this.handleError),
      );
  }

  /** POST /api/User/upload-photo */
  uploadPhoto(file: File): Observable<string> {
    const authErr = this.assertAuth();
    if (authErr) return authErr;
    if (!file.type.startsWith('image/'))
      return throwError(() => new Error('Only image files are allowed.'));
    if (file.size > 5 * 1024 * 1024)
      return throwError(() => new Error('Image must be under 5 MB.'));
    const fd = new FormData();
    fd.append('userId', String(this.userId));
    fd.append('file', file);
    return this.http
      .post<{ imageUrl: string }>(`${BASE_USER}/upload-photo`, fd, { headers: this.authHeaders })
      .pipe(
        map((res) => res.imageUrl.replace('http://', 'https://')),
        catchError(this.handleError),
      );
  }

  /** PUT /api/User/change-password */
  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    const authErr = this.assertAuth();
    if (authErr) return authErr;
    const params = new HttpParams()
      .set('email', this.email)
      .set('dzveliparoli', oldPassword)
      .set('axaliparoli', newPassword);
    return this.http
      .put(`${BASE_USER}/change-password`, null, {
        headers: this.authHeaders,
        params,
        responseType: 'text',
      })
      .pipe(
        map(() => void 0),
        catchError(this.handleError),
      );
  }

  /** POST /api/User/subscribe-newsletter */
  subscribeNewsletter(): Observable<void> {
    const authErr = this.assertAuth();
    if (authErr) return authErr;
    const headers = this.authHeaders.set('Content-Type', 'application/json');
    return this.http
      .post<void>(`${BASE_USER}/subscribe-newsletter`, JSON.stringify(this.email), { headers })
      .pipe(catchError(this.handleError));
  }

  /** DELETE /api/User/unsubscribe-newsletter?email=... */
  unsubscribeNewsletter(): Observable<void> {
    const authErr = this.assertAuth();
    if (authErr) return authErr;
    const params = new HttpParams().set('email', this.email);
    return this.http
      .delete<void>(`${BASE_USER}/unsubscribe-newsletter`, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  /** PUT /api/User/save-card */
  saveCard(card: CardFormData): Observable<void> {
    const authErr = this.assertAuth();
    if (authErr) return authErr;
    const body: SaveCardRequest = {
      userId: this.userId,
      cardNumber: card.cardNumber.replace(/\s/g, ''),
      cardHolder: card.cardHolder,
      expiry: card.expiry,
    };
    return this.http
      .put<void>(`${BASE_USER}/save-card`, body, { headers: this.authHeaders })
      .pipe(catchError(this.handleError));
  }

  /** DELETE /api/User/remove-card?userId=... */
  removeCard(): Observable<void> {
    const authErr = this.assertAuth();
    if (authErr) return authErr;
    const params = new HttpParams().set('userId', String(this.userId));
    return this.http
      .delete<void>(`${BASE_USER}/remove-card`, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  /** DELETE /api/User/delete-user?email=... */
  deleteUser(): Observable<void> {
    const authErr = this.assertAuth();
    if (authErr) return authErr;
    const params = new HttpParams().set('email', this.email);
    return this.http
      .delete<void>(`${BASE_USER}/delete-user`, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  clearAuth(): void {
    localStorage.clear();
  }

  /**
   * GET /api/User/get-user?email=... — orders come from user.payments or
   * a dedicated endpoint. The swagger shows POST /api/User/post-buy for placing
   * orders; the purchased books live inside the Payment objects.
   * We re-use getUser() and extract basket/payment data there.
   *
   * If a dedicated orders endpoint exists in the future, swap this out.
   * For now we call the User endpoint and cast the payments array.
   */
  getOrders(): Observable<BookOrder[]> {
    const authErr = this.assertAuth();
    if (authErr) return authErr;
    const params = new HttpParams().set('email', this.email);
    return this.http
      .get<BookOrder[]>(`${BASE_USER}/get-orders`, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  // ── Payment ─────────────────────────────────────────────────────────────────

  /** POST /api/Payment/pay */
  pay(payload: PayRequest): Observable<void> {
    const authErr = this.assertAuth();
    if (authErr) return authErr;
    const params = new HttpParams()
      .set('userId', String(payload.userId))
      .set('cardNumber', payload.cardNumber)
      .set('cardHolderName', payload.cardHolderName)
      .set('expiryDate', payload.expiryDate)
      .set('cvv', payload.cvv)
      .set('exactAddress', payload.exactAddress)
      .set('amount', String(payload.amount));
    return this.http
      .post<void>(`${BASE_PAYMENT}/pay`, null, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  /** GET /api/Payment/all */
  getAllPayments(): Observable<Payment[]> {
    const authErr = this.assertAuth();
    if (authErr) return authErr;
    return this.http
      .get<Payment[]>(`${BASE_PAYMENT}/all`, { headers: this.authHeaders })
      .pipe(catchError(this.handleError));
  }

  /** GET /api/Payment/user/{userId} */
  getUserPayments(): Observable<Payment[]> {
    const authErr = this.assertAuth();
    if (authErr) return authErr;
    return this.http
      .get<Payment[]>(`${BASE_PAYMENT}/user/${this.userId}`, { headers: this.authHeaders })
      .pipe(catchError(this.handleError));
  }

  /** DELETE /api/Payment/{id} */
  deletePayment(paymentId: number): Observable<void> {
    const authErr = this.assertAuth();
    if (authErr) return authErr;
    return this.http
      .delete<void>(`${BASE_PAYMENT}/${paymentId}`, { headers: this.authHeaders })
      .pipe(catchError(this.handleError));
  }

  // ── Error handler ───────────────────────────────────────────────────────────

  private handleError(err: any): Observable<never> {
    const message =
      err?.error?.message ??
      err?.error ??
      err?.message ??
      'Something went wrong. Please try again.';
    return throwError(() => new Error(message));
  }
  /** POST /api/User/subscribe-newsletter — public, takes email directly */
  subscribeNewsletterPublic(email: string): Observable<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http
      .post(`${BASE_USER}/subscribe-newsletter`, JSON.stringify(email), {
        headers,
        responseType: 'text',
      })
      .pipe(
        map(() => void 0),
        catchError(this.handleError),
      );
  }
}
