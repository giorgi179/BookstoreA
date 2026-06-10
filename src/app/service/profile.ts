import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

const BASE_USER    = 'https://bookapi-h00v.onrender.com/api/User';
const BASE_PAYMENT = 'https://bookapi-h00v.onrender.com/api/Payment';

// ─── Request / Response models ───────────────────────────────────────────────

export interface UpdateProfileRequest {
  userId:   number;
  fullName: string;
  phone:    string;
}

export interface SaveCardRequest {
  userId:     number;
  cardNumber: string;
  cardHolder: string;
  expiry:     string;
}

export interface PayRequest {
  userId:         number;
  cardNumber:     string;
  cardHolderName: string;
  expiryDate:     string;
  cvv:            string;
  exactAddress:   string;
  amount:         number;
}

export interface UserProfile {
  id:        number;
  email:     string;
  firstName: string;
  lastName:  string;
  phone:     string;
  cardNumber?: string;
  cardHolder?: string;
  expiry?:     string;
  subscribed?: boolean;
}

export interface BookOrder {
  id:      number;
  bookUrl: string;
  title:   string;
  isbn:    string;
  price:   number;
}

export interface Payment {
  id:             number;
  userId:         number;
  cardHolderName: string;
  amount:         number;
  exactAddress:   string;
  createdAt?:     string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  // ── Auth helpers ────────────────────────────────────────────────────────────

  private get token():  string { return localStorage.getItem('authToken') ?? ''; }
  private get email():  string { return localStorage.getItem('email')     ?? ''; }
  private get userId(): number { return Number(localStorage.getItem('userId') ?? 0); }

  /** Bearer-only headers (for JSON bodies — Content-Type set by Angular) */
  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.token}` });
  }

  /** Guards against missing credentials before every call */
  private assertAuth(): void {
    if (!this.token || !this.userId) {
      throw new Error('User is not authenticated.');
    }
  }

  // ── User ────────────────────────────────────────────────────────────────────

  getUser(): Observable<UserProfile> {
    this.assertAuth();
    const params = new HttpParams().set('email', this.email);
    return this.http
      .get<UserProfile>(`${BASE_USER}/get-user`, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  getUserById(id: number): Observable<UserProfile> {
    this.assertAuth();
    return this.http
      .get<UserProfile>(`${BASE_USER}/get-user-${id}`, { headers: this.authHeaders })
      .pipe(catchError(this.handleError));
  }

  updateProfile(data: { firstName: string; lastName: string; phone: string }): Observable<void> {
    this.assertAuth();
    const body: UpdateProfileRequest = {
      userId:   this.userId,
      fullName: `${data.firstName} ${data.lastName}`.trim(),
      phone:    data.phone,
    };
    return this.http
      .put<void>(`${BASE_USER}/update-profile`, body, { headers: this.authHeaders })
      .pipe(catchError(this.handleError));
  }

  // ── Photo ───────────────────────────────────────────────────────────────────

  getPhoto(): Observable<string> {
    this.assertAuth();
    const params = new HttpParams().set('email', this.email);
    return this.http
      .get(`${BASE_USER}/get-photo`, {
        headers:      this.authHeaders,
        params,
        responseType: 'text',
      })
      .pipe(catchError(this.handleError));
  }

  uploadPhoto(file: File): Observable<void> {
    this.assertAuth();
    if (!file.type.startsWith('image/')) {
      return throwError(() => new Error('Only image files are allowed.'));
    }
    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      return throwError(() => new Error(`Image must be under ${MAX_MB} MB.`));
    }
    const fd = new FormData();
    fd.append('userId', String(this.userId));
    fd.append('file', file);
    return this.http
      .post<void>(`${BASE_USER}/upload-photo`, fd, { headers: this.authHeaders })
      .pipe(catchError(this.handleError));
  }

  // ── Password ────────────────────────────────────────────────────────────────

  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    this.assertAuth();
    if (newPassword.length < 8) {
      return throwError(() => new Error('New password must be at least 8 characters.'));
    }
    const params = new HttpParams()
      .set('email',        this.email)
      .set('dzveliparoli', oldPassword)
      .set('axaliparoli',  newPassword);
    return this.http
      .put<void>(`${BASE_USER}/change-password`, null, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  // ── Newsletter ──────────────────────────────────────────────────────────────

  subscribeNewsletter(): Observable<void> {
    this.assertAuth();
    const headers = this.authHeaders.set('Content-Type', 'application/json');
    return this.http
      .post<void>(`${BASE_USER}/subscribe-newsletter`, JSON.stringify(this.email), { headers })
      .pipe(catchError(this.handleError));
  }

  unsubscribeNewsletter(): Observable<void> {
    this.assertAuth();
    const params = new HttpParams().set('email', this.email);
    return this.http
      .delete<void>(`${BASE_USER}/unsubscribe-newsletter`, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  // ── Card ────────────────────────────────────────────────────────────────────

  saveCard(card: { cardNumber: string; cardHolder: string; expiry: string }): Observable<void> {
    this.assertAuth();
    const body: SaveCardRequest = { userId: this.userId, ...card };
    return this.http
      .put<void>(`${BASE_USER}/save-card`, body, { headers: this.authHeaders })
      .pipe(catchError(this.handleError));
  }

  removeCard(): Observable<void> {
    this.assertAuth();
    const params = new HttpParams().set('userId', String(this.userId));
    return this.http
      .delete<void>(`${BASE_USER}/remove-card`, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  // ── Account ─────────────────────────────────────────────────────────────────

  deleteUser(): Observable<void> {
    this.assertAuth();
    const params = new HttpParams().set('email', this.email);
    return this.http
      .delete<void>(`${BASE_USER}/delete-user`, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  // ── Library ─────────────────────────────────────────────────────────────────

  getOrders(): Observable<BookOrder[]> {
    this.assertAuth();
    const params = new HttpParams().set('email', this.email);
    return this.http
      .get<BookOrder[]>(`${BASE_USER}/get-user`, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  // ── Payment ─────────────────────────────────────────────────────────────────

  pay(payload: PayRequest): Observable<void> {
    this.assertAuth();
    const params = new HttpParams()
      .set('userId',         String(payload.userId))
      .set('cardNumber',     payload.cardNumber)
      .set('cardHolderName', payload.cardHolderName)
      .set('expiryDate',     payload.expiryDate)
      .set('cvv',            payload.cvv)
      .set('exactAddress',   payload.exactAddress)
      .set('amount',         String(payload.amount));
    return this.http
      .post<void>(`${BASE_PAYMENT}/pay`, null, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  getAllPayments(): Observable<Payment[]> {
    this.assertAuth();
    return this.http
      .get<Payment[]>(`${BASE_PAYMENT}/all`, { headers: this.authHeaders })
      .pipe(catchError(this.handleError));
  }

  getUserPayments(): Observable<Payment[]> {
    this.assertAuth();
    return this.http
      .get<Payment[]>(`${BASE_PAYMENT}/user/${this.userId}`, { headers: this.authHeaders })
      .pipe(catchError(this.handleError));
  }

  deletePayment(paymentId: number): Observable<void> {
    this.assertAuth();
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
}