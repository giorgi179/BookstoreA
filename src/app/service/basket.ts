import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BasketGroup } from '../controlers';


const API = 'https://bookapi-h00v.onrender.com/api';

@Injectable({ providedIn: 'root' })
export class BasketService {
  private http = inject(HttpClient);

  private get token():  string { return localStorage.getItem('authToken') ?? ''; }
  private get userId(): number { return Number(localStorage.getItem('userId') ?? 0); }

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.token}` });
  }

  getBaskets(): Observable<BasketGroup[]> {
    const params = new HttpParams().set('userId', String(this.userId));
    return this.http
      .get<BasketGroup[]>(`${API}/BasketItem/get-baskets`, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  addItem(bookId: number, quantity = 1): Observable<void> {
    const params = new HttpParams()
      .set('userId',   String(this.userId))
      .set('bookId',   String(bookId))
      .set('quantity', String(quantity));
    return this.http
      .post<void>(`${API}/BasketItem/add-basket`, null, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  updateItem(basketId: number, bookId: number, quantity: number): Observable<void> {
    const params = new HttpParams()
      .set('basketId', String(basketId))
      .set('bookId',   String(bookId))
      .set('quantity', String(quantity));
    return this.http
      .put<void>(`${API}/BasketItem/update-basket-item`, null, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  deleteItem(id: number): Observable<void> {
    const params = new HttpParams().set('id', String(id));
    return this.http
      .delete<void>(`${API}/BasketItem/delete-basket`, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  clearBasket(): Observable<void> {
    const params = new HttpParams().set('userId', String(this.userId));
    return this.http
      .delete<void>(`${API}/BasketItem/clear-basket`, { headers: this.authHeaders, params })
      .pipe(catchError(this.handleError));
  }

  private handleError(err: unknown): Observable<never> {
    const e = err as { error?: { message?: string }; message?: string };
    const message = e?.error?.message ?? e?.message ?? 'Something went wrong.';
    return throwError(() => new Error(message));
  }
}