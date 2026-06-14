import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs';
import { AdminLoginService } from './admin-login';
import {
  AppUser,
  Book,
  DashboardStats,
  Message,
  NewBook,
  BasketGroup,
  Payment,
} from '../controlers';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API = 'https://bookapi-h00v.onrender.com/api/Admin';

  readonly stats    = signal<DashboardStats | null>(null);
  readonly books    = signal<Book[]>([]);
  readonly users    = signal<AppUser[]>([]);
  readonly messages = signal<Message[]>([]);
  readonly baskets  = signal<BasketGroup[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly subscribers = signal<AppUser[]>([]);
  readonly loading  = signal(false);

  constructor(
    private http: HttpClient,
    private auth: AdminLoginService,
  ) {}

  // ─── DASHBOARD ──────────────────────────────────────────────────────────────
  loadDashboard() {
    this.loading.set(true);
    return this.http.get<DashboardStats>(`${this.API}/dashboard`, { headers: this.#h() }).pipe(
      tap({
        next: (res) => { this.stats.set(res); this.loading.set(false); },
        error: () => this.loading.set(false),
      }),
    );
  }

  // ─── BOOKS ──────────────────────────────────────────────────────────────────
  loadBooks() {
    return this.http.get<Book[]>(`${this.API}/books`, { headers: this.#h() }).pipe(
      tap({ next: (res) => this.books.set(res) }),
    );
  }

  addBook(book: NewBook) {
    return this.http.post<Book>(`${this.API}/books`, book, { headers: this.#h() }).pipe(
      tap({ next: (res) => this.books.update((b) => [res, ...b]) }),
    );
  }

  updateBook(id: number, book: NewBook) {
    return this.http.put<Book>(`${this.API}/books/${id}`, book, { headers: this.#h() }).pipe(
      tap({ next: (res) => this.books.update((b) => b.map((x) => (x.id === id ? res : x))) }),
    );
  }

  deleteBook(id: number) {
    return this.http.delete(`${this.API}/books/${id}`, { headers: this.#h() }).pipe(
      tap({ next: () => this.books.update((b) => b.filter((x) => x.id !== id)) }),
    );
  }

  updateStock(id: number, stock: number) {
    return this.http.patch(`${this.API}/books/${id}/stock`, stock, { headers: this.#h() }).pipe(
      tap({ next: () => this.books.update((b) => b.map((x) => (x.id === id ? { ...x, stock } : x))) }),
    );
  }

  // ─── USERS ──────────────────────────────────────────────────────────────────
  loadUsers() {
    return this.http.get<AppUser[]>(`${this.API}/users`, { headers: this.#h() }).pipe(
      tap({ next: (res) => this.users.set(res) }),
    );
  }

  loadSubscribers() {
    return this.http.get<AppUser[]>(`${this.API}/users/subscribers`, { headers: this.#h() }).pipe(
      tap({ next: (res) => this.subscribers.set(res) }),
    );
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.API}/users/${id}`, { headers: this.#h() }).pipe(
      tap({ next: () => this.users.update((u) => u.filter((x) => x.id !== id)) }),
    );
  }

  verifyUser(id: number) {
    return this.http.patch(`${this.API}/users/${id}/verify`, {}, { headers: this.#h() }).pipe(
      tap({ next: () => this.users.update((u) => u.map((x) => (x.id === id ? { ...x, isVerified: true } : x))) }),
    );
  }

  unverifyUser(id: number) {
    return this.http.patch(`${this.API}/users/${id}/unverify`, {}, { headers: this.#h() }).pipe(
      tap({ next: () => this.users.update((u) => u.map((x) => (x.id === id ? { ...x, isVerified: false } : x))) }),
    );
  }

  deleteUserCard(id: number) {
    return this.http.delete(`${this.API}/users/${id}/card`, { headers: this.#h() }).pipe(
      tap({ next: () => this.users.update((u) => u.map((x) => (x.id === id ? { ...x, savedCardMasked: null } : x))) }),
    );
  }

  // ─── BASKETS ────────────────────────────────────────────────────────────────
  loadBaskets() {
    return this.http.get<BasketGroup[]>(`${this.API}/baskets`, { headers: this.#h() }).pipe(
      tap({ next: (res) => this.baskets.set(res) }),
    );
  }

  deleteBasket(id: number) {
    return this.http.delete(`${this.API}/baskets/${id}`, { headers: this.#h() }).pipe(
      tap({ next: () => this.baskets.update((b) => b.filter((x) => x.id !== id)) }),
    );
  }

  deleteBasketItem(itemId: number, basketId: number) {
    return this.http.delete(`${this.API}/basket-items/${itemId}`, { headers: this.#h() }).pipe(
      tap({
        next: () =>
          this.baskets.update((bs) =>
            bs.map((b) =>
              b.id === basketId
                ? { ...b, items: b.items.filter((i) => i.id !== itemId) }
                : b,
            ),
          ),
      }),
    );
  }

  updateBasketItem(itemId: number, basketId: number, quantity: number) {
    return this.http.put(`${this.API}/basket-items/${itemId}`, quantity, { headers: this.#h() }).pipe(
      tap({
        next: () =>
          this.baskets.update((bs) =>
            bs.map((b) =>
              b.id === basketId
                ? { ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)) }
                : b,
            ),
          ),
      }),
    );
  }

  // ─── PAYMENTS ───────────────────────────────────────────────────────────────
  loadPayments() {
    return this.http.get<Payment[]>(`${this.API}/payments`, { headers: this.#h() }).pipe(
      tap({ next: (res) => this.payments.set(res) }),
    );
  }

  deletePayment(id: number) {
    return this.http.delete(`${this.API}/payments/${id}`, { headers: this.#h() }).pipe(
      tap({ next: () => this.payments.update((p) => p.filter((x) => x.id !== id)) }),
    );
  }

  updatePaymentStatus(id: number, status: string) {
    return this.http.patch(`${this.API}/payments/${id}/status`, JSON.stringify(status), {
      headers: this.#h().set('Content-Type', 'application/json'),
    }).pipe(
      tap({ next: () => this.payments.update((p) => p.map((x) => (x.id === id ? { ...x, status } : x))) }),
    );
  }

  // ─── MESSAGES ───────────────────────────────────────────────────────────────
  loadMessages() {
    return this.http.get<Message[]>(`${this.API}/messages`, { headers: this.#h() }).pipe(
      tap({ next: (res) => this.messages.set(res) }),
    );
  }

  deleteMessage(id: number) {
    return this.http.delete(`${this.API}/messages/${id}`, { headers: this.#h() }).pipe(
      tap({ next: () => this.messages.update((m) => m.filter((x) => x.id !== id)) }),
    );
  }

  // ─── Private ────────────────────────────────────────────────────────────────
  #h() {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.token()}` });
  }
}