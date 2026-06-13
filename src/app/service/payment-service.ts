import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

const API = 'https://bookapi-h00v.onrender.com/api';

export interface SavedCard {
  id: number;
  cardHolderName: string;
  cardNumber: string; // masked: "**** **** **** 1234"
  expiryDate: string;
}

export interface PaymentResult {
  success: boolean;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);

  private get token(): string {
    return localStorage.getItem('authToken') ?? '';
  }
  private get userId(): number {
    return Number(localStorage.getItem('userId') ?? 0);
  }
  private get email(): string {
    return localStorage.getItem('email') ?? '';
  }

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.token}` });
  }

  /**
   * შენახული ბარათი UserProfile-შია.
   * GET /api/User/get-user?email=...
   * response fields: savedCardMasked, savedCardHolder, savedCardExpiry
   */
  getSavedCard(): Observable<SavedCard | null> {
    if (!this.token || !this.email) return of(null);

    const params = new HttpParams().set('email', this.email);
    return this.http.get<any>(`${API}/User/get-user`, { headers: this.authHeaders, params }).pipe(
      map((user) => {
        // backend-ი შეიძლება აბრუნებდეს camelCase ან PascalCase
        const masked = user?.savedCardMasked ?? user?.SavedCardMasked ?? null;
        const holder = user?.savedCardHolder ?? user?.SavedCardHolder ?? '';
        const expiry = user?.savedCardExpiry ?? user?.SavedCardExpiry ?? '';
        const id = user?.id ?? user?.Id ?? 0;

        console.log('[PaymentService] getSavedCard response:', { masked, holder, expiry });

        if (!masked) return null;

        return {
          id,
          cardNumber: masked,
          cardHolderName: holder,
          expiryDate: expiry,
        } as SavedCard;
      }),
      catchError((err) => {
        console.warn('[PaymentService] getSavedCard error:', err);
        return of(null);
      }),
    );
  }

  pay(
    cardNumber: string,
    cardHolderName: string,
    expiryDate: string,
    cvv: string,
    exactAddress: string,
    amount: number,
    bookId?: number, // ✅ დაამატე
  ): Observable<PaymentResult> {
    let params = new HttpParams()
      .set('userId', String(this.userId))
      .set('cardNumber', cardNumber)
      .set('cardHolderName', cardHolderName)
      .set('expiryDate', expiryDate)
      .set('cvv', cvv)
      .set('exactAddress', exactAddress)
      .set('amount', String(amount));

    if (bookId) params = params.set('bookId', String(bookId)); // ✅ დაამატე

    return this.http
      .post(`${API}/Payment/pay`, null, {
        headers: this.authHeaders,
        params,
        observe: 'response',
        responseType: 'text',
      })
      .pipe(
        map((res) => ({ success: res.status === 200 }) as PaymentResult),
        catchError((err) => {
          const msg = err?.error?.message ?? err?.error ?? err?.message ?? 'Payment failed.';
          return throwError(() => new Error(msg));
        }),
      );
  }

  /**
   * გადახდა შენახული ბარათით.
   */
  payWithSaved(
    savedCard: SavedCard,
    cvv: string,
    exactAddress: string,
    amount: number,
  ): Observable<PaymentResult> {
    return this.pay(
      savedCard.cardNumber,
      savedCard.cardHolderName,
      savedCard.expiryDate,
      cvv,
      exactAddress,
      amount,
    );
  }

  /** DELETE /api/User/remove-card?userId=... */
  deleteCard(userId: number): Observable<void> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http
      .delete<void>(`${API}/User/remove-card`, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  /** PUT /api/User/save-card */
  saveCard(cardNumber: string, cardHolderName: string, expiryDate: string): Observable<void> {
    const body = {
      userId: this.userId,
      cardNumber: cardNumber.replace(/\s/g, ''),
      cardHolder: cardHolderName,
      expiry: expiryDate,
    };
    return this.http
      .put(`${API}/User/save-card`, body, {
        headers: this.authHeaders,
        responseType: 'text',
      })
      .pipe(
        map(() => void 0),
        catchError(this.handleError),
      );
  }

  private handleError(err: unknown): Observable<never> {
    const e = err as { error?: { message?: string }; message?: string };
    return throwError(() => new Error(e?.error?.message ?? e?.message ?? 'Something went wrong.'));
  }
}
