import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface AdminUser {
  fullName: string;
  email: string;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AdminLoginService {
  private readonly API = 'https://bookapi-h00v.onrender.com/api/Admin';

  readonly admin = signal<AdminUser | null>(this.#loadAdmin());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  isLoggedIn(): boolean {
    try {
      const raw = localStorage.getItem('admin');
      if (!raw) return false;
      const admin = JSON.parse(raw);
      return !!admin?.token;
    } catch {
      return false;
    }
  }
  readonly token = computed(() => this.admin()?.token ?? null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(email: string, password: string) {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<AdminUser>(`${this.API}/login`, { email, password }).pipe(
      tap({
        next: (res) => {
          // ✅ პირველ რიგში token-ი ვინახავთ
          this.admin.set(res);
          localStorage.setItem('admin', JSON.stringify(res));
          this.loading.set(false);
          // ✅ მხოლოდ შემდეგ ვნავიგირდებით panel-ზე
          this.router.navigate(['/mtavari-panel']);
        },
        error: (err) => {
          this.error.set(typeof err.error === 'string' ? err.error : 'Email ან პაროლი არასწორია');
          this.loading.set(false);
        },
      }),
    );
  }

  logout() {
    this.admin.set(null);
    localStorage.removeItem('admin');
    this.router.navigate(['/mtavari-login']);
  }

  #loadAdmin(): AdminUser | null {
    try {
      const raw = localStorage.getItem('admin');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
