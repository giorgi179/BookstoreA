import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ProfileService, UserProfile, BookOrder } from '../../service/profile';
import { CardFormData } from '../../controlers';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// ─── Animation ───────────────────────────────────────────────────────────────

export const fadeSlide = trigger('fadeSlide', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(12px)' }),
    animate('260ms cubic-bezier(0.22,1,0.36,1)', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

// ─── Nav items ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
           </svg>`,
  },
  {
    id: 'security',
    label: 'Security',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
           </svg>`,
  },
  {
    id: 'library',
    label: 'Library',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
           </svg>`,
  },
  {
    id: 'payment',
    label: 'Payment',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
           </svg>`,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="12" cy="12" r="3"/>
             <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
           </svg>`,
  },
] as const;

type TabId = (typeof NAV_ITEMS)[number]['id'];

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
  animations: [fadeSlide],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class Profile implements OnInit {
  private svc = inject(ProfileService);
  private router = inject(Router);

  // ── State ──────────────────────────────────────────────────────────────────

  tab: TabId = 'profile';
  navItems = NAV_ITEMS;
  defaultAvatar = 'assets/default-avatar.png';

  user: UserProfile | null = null;
  photoUrl: string | null = null;
  orders: BookOrder[] = [];

  displayName = '';
  uploadingPhoto = false;

  // Profile form
  editForm = { firstName: '', lastName: '', phone: '' };
  saving = false;
  saveMsg = '';
  saveErr = false;

  // Password form
  pwForm = { current: '', next: '', confirm: '' };
  showPw = [false, false, false];
  changingPw = false;
  pwMsg = '';
  pwErr = '';

  // Card
  card: CardFormData = { cardNumber: '', cardHolder: '', expiry: '' };
  savingCard = false;
  cardMsg = '';
  cardErr = '';

  // Settings
  subscribed = false;
  showDeleteModal = false;
  deleting = false;

  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadUser();
    this.loadPhoto();
    this.loadOrders();
  }

  // ── Loaders ────────────────────────────────────────────────────────────────

  private loadUser(): void {
    this.svc.getUser().subscribe({
      next: (u) => {
        this.user = u;
        this.displayName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email;
        this.editForm = {
          firstName: u.firstName ?? '',
          lastName: u.lastName ?? '',
          phone: u.phone ?? '',
        };
        this.subscribed = u.subscribed ?? false;
        if (u.cardNumber) {
          this.card = {
            cardNumber: u.cardNumber,
            cardHolder: u.cardHolder ?? '',
            expiry: u.expiry ?? '',
          };
        }
      },
      error: () => this.router.navigate(['/login']),
    });
  }

  private loadPhoto(): void {
    this.svc.getPhoto().subscribe({
      next: (url) => {
        this.photoUrl = url || null;
      },
      error: () => {
        this.photoUrl = null;
      },
    });
  }

  private loadOrders(): void {
    this.svc.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
  // ── Photo ──────────────────────────────────────────────────────────────────

  triggerPhoto(): void {
    this.photoInput.nativeElement.click();
  }

  onPhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingPhoto = true;
    this.svc.uploadPhoto(file).subscribe({
      next: () => {
        this.loadPhoto();
        this.uploadingPhoto = false;
      },
      error: (err) => {
        alert(err.message);
        this.uploadingPhoto = false;
      },
    });
  }

  // ── Profile ────────────────────────────────────────────────────────────────

  saveProfile(): void {
    if (!this.editForm.firstName.trim()) {
      this.saveMsg = 'First name is required.';
      this.saveErr = true;
      return;
    }
    this.saving = true;
    this.saveMsg = '';
    this.saveErr = false;
    this.svc.updateProfile(this.editForm).subscribe({
      next: () => {
        this.saving = false;
        this.saveMsg = 'Changes saved.';
        this.displayName = `${this.editForm.firstName} ${this.editForm.lastName}`.trim();
      },
      error: (err) => {
        this.saving = false;
        this.saveMsg = err.message;
        this.saveErr = true;
      },
    });
  }

  // ── Password ───────────────────────────────────────────────────────────────

  changePassword(): void {
    this.pwErr = '';
    this.pwMsg = '';
    if (!this.pwForm.current) {
      this.pwErr = 'Enter your current password.';
      return;
    }
    if (this.pwForm.next.length < 8) {
      this.pwErr = 'Password must be at least 8 characters.';
      return;
    }
    if (this.pwForm.next !== this.pwForm.confirm) {
      this.pwErr = 'Passwords do not match.';
      return;
    }

    this.changingPw = true;
    this.svc.changePassword(this.pwForm.current, this.pwForm.next).subscribe({
      next: () => {
        this.changingPw = false;
        this.pwMsg = 'Password updated.';
        this.pwForm = { current: '', next: '', confirm: '' };
      },
      error: (err) => {
        this.changingPw = false;
        this.pwErr = err.message;
      },
    });
  }

  // ── Card ───────────────────────────────────────────────────────────────────

  saveCard(): void {
    this.cardMsg = '';
    this.cardErr = '';
    const raw = this.card.cardNumber.replace(/\s/g, '');
    if (raw.length !== 16 || !/^\d+$/.test(raw)) {
      this.cardErr = 'Enter a valid 16-digit card number.';
      return;
    }
    if (!this.card.expiry.match(/^\d{2}\/\d{2}$/)) {
      this.cardErr = 'Enter expiry as MM/YY.';
      return;
    }
    if (!this.card.cardHolder.trim()) {
      this.cardErr = 'Enter the cardholder name.';
      return;
    }
    this.savingCard = true;
    this.svc.saveCard(this.card).subscribe({
      next: () => {
        this.savingCard = false;
        this.cardMsg = 'Card saved.';
      },
      error: (err) => {
        this.savingCard = false;
        this.cardErr = err.message;
      },
    });
  }

  removeCard(): void {
    this.svc.removeCard().subscribe({
      next: () => {
        this.card = { cardNumber: '', cardHolder: '', expiry: '' };
        this.cardMsg = 'Card removed.';
      },
      error: (err) => {
        this.cardErr = err.message;
      },
    });
  }

  // ── Card formatting helpers ────────────────────────────────────────────────

  formatCard(n: string): string {
    return n
      .replace(/\s/g, '')
      .replace(/(.{4})/g, '$1 ')
      .trim();
  }

  formatCardInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const raw = el.value.replace(/\D/g, '').slice(0, 16);
    el.value = raw.replace(/(.{4})/g, '$1 ').trim();
    this.card.cardNumber = el.value;
  }

  formatExpiry(event: Event): void {
    const el = event.target as HTMLInputElement;
    let raw = el.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length > 2) raw = raw.slice(0, 2) + '/' + raw.slice(2);
    el.value = raw;
    this.card.expiry = raw;
  }

  // ── Newsletter ─────────────────────────────────────────────────────────────

  toggleNewsletter(): void {
    const action$ = this.subscribed
      ? this.svc.unsubscribeNewsletter()
      : this.svc.subscribeNewsletter();
    action$.subscribe({
      next: () => {
        this.subscribed = !this.subscribed;
      },
      error: (err) => alert(err.message),
    });
  }

  // ── Account deletion ───────────────────────────────────────────────────────

  deleteAccount(): void {
    this.deleting = true;
    this.svc.deleteUser().subscribe({
      next: () => {
        localStorage.clear();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.deleting = false;
        alert(err.message);
      },
    });
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
