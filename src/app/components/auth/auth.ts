import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Auths } from '../../service/auths';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';

const GOOGLE_CLIENT_ID = '911959882752-mr8prh1ooqtt16v1icbkrser6td2gsl1.apps.googleusercontent.com';

// ── Password Validator ────────────────────────────────────────────────────────
function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value ?? '';
  const rules = {
    minLength: v.length >= 12,
    uppercase: /[A-Z]/.test(v),
    lowercase: /[a-z]/.test(v),
    digit: /[0-9]/.test(v),
    special: /[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(v),
    noSpaces: !/\s/.test(v),
  };
  return Object.values(rules).every(Boolean) ? null : { passwordStrength: rules };
}

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth implements OnInit {
  private readonly authService = inject(Auths);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private tokenClient: any;

  // ── UI state ──────────────────────────────────────────────────────────────
  isSignUpMode = signal(false);
  showVerification = signal(false);
  isVerified = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showPassword = signal(false);
  isLoading = signal(false);
  showForgotPassword = signal(false);
  showResetPassword = signal(false);
  forgotEmail = signal('');

  // ── Password value as signal (გადის valueChanges-ზე) ─────────────────────
  private passwordValue = signal<string>('');

  private userId = 0;

  // ── Forms ─────────────────────────────────────────────────────────────────
  registerForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, strongPasswordValidator]],
    phone: ['', [Validators.pattern(/^\+?[0-9]{9,15}$/)]],
  });

  verifyForm = this.fb.group({
    code: ['', [Validators.required]],
  });

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  resetForm = this.fb.group({
    code: ['', Validators.required],
    newPassword: ['', [Validators.required, strongPasswordValidator]],
  });
  // ── Password rules — computed-ი passwordValue signal-ზე დაყრდნობით ───────
  passwordRules = computed(() => {
    const v = this.passwordValue();
    return {
      minLength: { label: 'მინიმუმ 12 სიმბოლო', met: v.length >= 12 },
      uppercase: { label: 'დიდი ასო (A–Z)', met: /[A-Z]/.test(v) },
      lowercase: { label: 'პატარა ასო (a–z)', met: /[a-z]/.test(v) },
      digit: { label: 'ციფრი (0–9)', met: /[0-9]/.test(v) },
      special: {
        label: 'სპეციალური სიმბოლო (!@#…)',
        met: /[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(v),
      },
      noSpaces: { label: 'გამოტოვება არ არის', met: v.length > 0 && !/\s/.test(v) },
    };
  });

  passwordStrength = computed(() => {
    const met = Object.values(this.passwordRules()).filter((r) => r.met).length;
    if (met <= 2) return { level: 'სუსტი', score: met, color: 'weak' };
    if (met <= 4) return { level: 'საშუალო', score: met, color: 'medium' };
    if (met === 5) return { level: 'კარგი', score: met, color: 'good' };
    return { level: 'ძლიერი', score: met, color: 'strong' };
  });

  get passwordRulesArray() {
    return Object.values(this.passwordRules());
  }

  openForgotPassword(): void {
    this.showForgotPassword.set(true);
    this.clearMessages();
  }

  closeForgotPassword(): void {
    this.showForgotPassword.set(false);
    this.showResetPassword.set(false);
    this.forgotForm.reset();
    this.resetForm.reset();
    this.clearMessages();
  }

  sendForgotCode(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }
    this.clearMessages();
    this.isLoading.set(true);
    const email = this.forgotForm.getRawValue().email!;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.forgotEmail.set(email);
        this.successMessage.set('კოდი გამოგზავნილია ელ-ფოსტაზე');
        this.showForgotPassword.set(false);
        this.showResetPassword.set(true);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'შეცდომა. სცადეთ ხელახლა.');
        this.isLoading.set(false);
      },
    });
  }

  submitReset(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    this.clearMessages();
    this.isLoading.set(true);
    const { code, newPassword } = this.resetForm.getRawValue();

    this.authService
      .resetPassword({
        email: this.forgotEmail(),
        code: code!,
        newPassword: newPassword!,
      })
      .subscribe({
        next: () => {
          this.successMessage.set('პაროლი წარმატებით შეიცვალა!');
          this.showResetPassword.set(false);
          this.isLoading.set(false);
          setTimeout(() => this.closeForgotPassword(), 1500);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message ?? 'კოდი არასწორია');
          this.isLoading.set(false);
        },
      });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    // password form value → signal-ში გადაყვანა
    this.registerForm.get('password')!.valueChanges.subscribe((val) => {
      this.passwordValue.set(val ?? '');
    });

    this.initGoogleClient();
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  private initGoogleClient(): void {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      setTimeout(() => this.initGoogleClient(), 200);
      return;
    }
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: (tokenResponse: any) => {
        if (!tokenResponse.access_token) {
          this.errorMessage.set('Google-ით შესვლა ვერ მოხერხდა');
          return;
        }
        this.isLoading.set(true);
        this.authService.googleLogin(tokenResponse.access_token).subscribe({
          next: (res) => {
            this.authService.setToken(res.userId, res.token);
            this.router.navigate(['/']);
          },
          error: (err) => {
            this.errorMessage.set(err.error?.message ?? 'Google-ით შესვლა ვერ მოხერხდა');
            this.isLoading.set(false);
          },
        });
      },
    });
  }

  signInWithGoogle(): void {
    if (!this.tokenClient) {
      this.errorMessage.set('Google ჯერ მზად არ არის. სცადეთ ხელახლა.');
      return;
    }
    this.clearMessages();
    this.tokenClient.requestAccessToken({ prompt: 'select_account' });
  }

  // Facebook — stub
  signInWithFacebook(): void {
    this.errorMessage.set('Facebook login coming soon.');
  }

  // ── Registration ──────────────────────────────────────────────────────────
  signUp(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.clearMessages();
    this.isLoading.set(true);

    this.authService.register(this.registerForm.getRawValue() as any).subscribe({
      next: (response: any) => {
        this.userId = response.userId;
        this.successMessage.set(response.message ?? 'კოდი გამოგზავნილია ელ-ფოსტაზე');
        this.showVerification.set(true);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.log('Register error:', JSON.stringify(err.error));
        this.errorMessage.set(err.error?.message ?? 'შეცდომა. სცადეთ ხელახლა.');
        this.isLoading.set(false);
      },
    });
  }

  // ── Verification ──────────────────────────────────────────────────────────
  verify(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }
    this.clearMessages();
    this.isLoading.set(true);

    const code = this.verifyForm.getRawValue().code?.trim() ?? '';
    console.log('Sending code:', JSON.stringify(code), 'userId:', this.userId);

    this.authService.verify(this.userId, code).subscribe({
      next: () => {
        this.isVerified.set(true);
        this.showVerification.set(false);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message ?? err.error?.errors?.code?.[0] ?? 'კოდი არასწორია',
        );
        this.isLoading.set(false);
      },
    });
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.clearMessages();
    this.isLoading.set(true);

    this.authService.userLogin(this.loginForm.getRawValue() as any).subscribe({
      next: (response) => {
        // email token-იდან ამოიღე
        const payload = JSON.parse(atob(response.token.split('.')[1]));
        localStorage.setItem('email', payload.email);

        // setToken-ი signal-საც განაახლებს
        this.authService.setToken(response.userId, response.token);

        this.router.navigate(['/']);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'შესვლა ვერ მოხერხდა');
        this.isLoading.set(false);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  togglePanel(): void {
    this.isSignUpMode.update((v) => !v);
    this.isVerified.set(false);
    this.showVerification.set(false);
    this.clearMessages();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
