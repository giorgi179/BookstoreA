import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs';
import { AdminLoginService } from './admin-login';
import { AppUser, Book, DashboardStats, Message, NewBook } from '../controlers';



@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API = 'https://bookapi-h00v.onrender.com/api/Admin';

  readonly stats = signal<DashboardStats | null>(null);
  readonly books = signal<Book[]>([]);
  readonly users = signal<AppUser[]>([]);
  readonly messages = signal<Message[]>([]);
  readonly loading = signal(false);

  constructor(
    private http: HttpClient,
    private auth: AdminLoginService,
  ) {}

  // ─── DASHBOARD ─────────────────────────────
  loadDashboard() {
    this.loading.set(true);
    return this.http.get<DashboardStats>(`${this.API}/dashboard`, { headers: this.#h() }).pipe(
      tap({
        next: (res) => {
          this.stats.set(res);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      }),
    );
  }
  addBook(book: NewBook) {
    return this.http
      .post<Book>(`${this.API}/books`, book, { headers: this.#h() })
      .pipe(tap({ next: (res) => this.books.update((b) => [res, ...b]) }));
  }
  // ─── BOOKS ─────────────────────────────────
  loadBooks() {
    return this.http
      .get<Book[]>(`${this.API}/books`, { headers: this.#h() })
      .pipe(tap({ next: (res) => this.books.set(res) }));
  }

  deleteBook(id: number) {
    return this.http
      .delete(`${this.API}/books/${id}`, { headers: this.#h() })
      .pipe(tap({ next: () => this.books.update((b) => b.filter((x) => x.id !== id)) }));
  }

  updateStock(id: number, stock: number) {
    return this.http.patch(`${this.API}/books/${id}/stock`, stock, { headers: this.#h() }).pipe(
      tap({
        next: () => this.books.update((b) => b.map((x) => (x.id === id ? { ...x, stock } : x))),
      }),
    );
  }

  // ─── USERS ─────────────────────────────────
  loadUsers() {
    return this.http
      .get<AppUser[]>(`${this.API}/users`, { headers: this.#h() })
      .pipe(tap({ next: (res) => this.users.set(res) }));
  }

  deleteUser(id: number) {
    return this.http
      .delete(`${this.API}/users/${id}`, { headers: this.#h() })
      .pipe(tap({ next: () => this.users.update((u) => u.filter((x) => x.id !== id)) }));
  }

  verifyUser(id: number) {
    return this.http.patch(`${this.API}/users/${id}/verify`, {}, { headers: this.#h() }).pipe(
      tap({
        next: () =>
          this.users.update((u) => u.map((x) => (x.id === id ? { ...x, isVerified: true } : x))),
      }),
    );
  }

  // ─── MESSAGES ──────────────────────────────
  loadMessages() {
    return this.http.get<Message[]>(`${this.API}/messages`, { headers: this.#h() }).pipe(
      tap({
        next: (res) => {
          console.log('messages count:', res.length);
          console.log('messages full:', JSON.stringify(res, null, 2));
          this.messages.set(res);
        },
      }),
    );
  }
  deleteMessage(id: number) {
    return this.http
      .delete(`${this.API}/messages/${id}`, { headers: this.#h() })
      .pipe(tap({ next: () => this.messages.update((m) => m.filter((x) => x.id !== id)) }));
  }

  // ─── Private ───────────────────────────────
  #h() {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.token()}` });
  }
}
