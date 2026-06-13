import { Component, OnInit, ViewChild, ElementRef, inject, signal, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

import { BookOrder, CardFormData, UserProfile } from '../../controlers';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Loader } from '../loader/loader';
import { ProfileService } from '../../service/profile';
import { DomSanitizer } from '@angular/platform-browser';

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

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Loader],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate(
          '260ms cubic-bezier(0.22,1,0.36,1)',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
    ]),
  ],
})
export class Profile implements OnInit {
  private svc = inject(ProfileService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private zone = inject(NgZone);

  loader = signal(true);

  // ── Tab ──────────────────────────────────────────────────────────────────
  private _tab: TabId = 'profile';

  get tab(): TabId {
    return this._tab;
  }
  set tab(value: TabId) {
    this._tab = value;
    this.saveMsg = '';
    this.saveErr = false;
    this.pwMsg = '';
    this.pwErr = '';
    this.cardMsg = '';
    this.cardErr = '';
  }

  navItems = NAV_ITEMS.map((item) => ({
    ...item,
    safeIcon: this.sanitizer.bypassSecurityTrustHtml(item.icon),
  }));

  defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

  // ── User ─────────────────────────────────────────────────────────────────
  user: UserProfile | null = null;
  photoUrl: string | null = null;
  orders: BookOrder[] = [];
  displayName = '';

  // ── Profile form ─────────────────────────────────────────────────────────
  editForm = { firstName: '', lastName: '', phone: '' };
  saveMsg = '';
  saveErr = false;

  // ── Password form ─────────────────────────────────────────────────────────
  pwForm = { current: '', next: '', confirm: '' };
  showPw = [false, false, false];
  changingPw = false;
  pwMsg = '';
  pwErr = '';

  // ── Card ─────────────────────────────────────────────────────────────────
  card: CardFormData = { cardNumber: '', cardHolder: '', expiry: '' };
  newCard: CardFormData = { cardNumber: '', cardHolder: '', expiry: '' };
  cardMsg = '';
  cardErr = '';

  // ── Settings ─────────────────────────────────────────────────────────────
  subscribed = false;
  showDeleteModal = false;
  deleting = false;
  uploadingPhoto = false;

  @ViewChild('photoInput', { static: false })
  photoInput!: ElementRef<HTMLInputElement>;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadUser();
    this.loadPhoto();
    this.loadOrders();
  }

  // ── Loaders ───────────────────────────────────────────────────────────────
  private loadUser(): void {
    this.svc.getUser().subscribe({
      next: (u) => {
        this.zone.run(() => {
          this.user = u;
          const parts = (u.fullName ?? '').trim().split(/\s+/);
          const firstName = parts[0] ?? '';
          const lastName = parts.slice(1).join(' ');

          this.displayName = u.fullName?.trim() || u.email;
          this.editForm = { firstName, lastName, phone: u.phone ?? '' };
          this.subscribed = u.isSubscribed ?? false;
          this.orders = (u as any).payments ?? [];

          if (u.savedCardMasked) {
            this.card = {
              cardNumber: u.savedCardMasked,
              cardHolder: u.savedCardHolder ?? '',
              expiry: u.savedCardExpiry ?? '',
            };
          }
          this.loader.set(false);
        });
      },
      error: () => {
        this.zone.run(() => this.loader.set(false));
        this.logout();
      },
    });
  }

  private loadOrders(): void {
    this.svc.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders ?? [];
      },
      error: () => {
        this.orders = [];
      },
    });
  }

  private loadPhoto(): void {
    this.svc.getPhoto().subscribe({
      next: (url) => {
        this.zone.run(() => {
          // quotes-ს ვაშორებთ თუ სერვერი text/plain-ს გამოაგზავნის
          const clean = url?.replace(/^"|"$/g, '').trim();
          this.photoUrl = clean ? clean + '?t=' + Date.now() : null;
        });
      },
      error: () => {
        this.zone.run(() => {
          this.photoUrl = null;
        });
      },
    });
  }

  // ── Photo ─────────────────────────────────────────────────────────────────
  triggerPhoto(): void {
    this.photoInput?.nativeElement.click();
  }

  onPhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // ეგრევე local preview — სერვერს არ ელოდება
    const reader = new FileReader();
    reader.onload = (e) => {
      this.zone.run(() => {
        this.photoUrl = e.target?.result as string;
      });
    };
    reader.readAsDataURL(file);

    this.uploadingPhoto = true;

    this.svc.uploadPhoto(file).subscribe({
      next: (imageUrl) => {
        this.zone.run(() => {
          this.uploadingPhoto = false;
          // სერვერიდან მოსული URL-ით ვანახლებთ cache-bust-ით
          this.photoUrl = imageUrl + '?t=' + Date.now();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.uploadingPhoto = false;
          // upload ვერ მოხდა — preview-ც ვასუფთავებთ
          this.photoUrl = null;
        });
        alert(err.message);
      },
    });

    (event.target as HTMLInputElement).value = '';
  }

  // ── Profile ───────────────────────────────────────────────────────────────
  saveProfile(): void {
    if (!this.editForm.firstName.trim()) {
      this.saveMsg = 'First name is required.';
      this.saveErr = true;
      return;
    }

    const newDisplayName =
      `${this.editForm.firstName.trim()} ${this.editForm.lastName.trim()}`.trim();
    const prevDisplayName = this.displayName;
    const prevUser = this.user;

    this.displayName = newDisplayName;
    if (this.user) {
      this.user = { ...this.user, fullName: newDisplayName, phone: this.editForm.phone };
    }
    this.saveMsg = 'Changes saved.';
    this.saveErr = false;

    this.svc.updateProfile(this.editForm).subscribe({
      next: () => {},
      error: (err) => {
        this.saveMsg = err.message;
        this.saveErr = true;
        this.displayName = prevDisplayName;
        this.user = prevUser;
      },
    });
  }

  // ── Password ──────────────────────────────────────────────────────────────
  changePassword(): void {
    this.pwErr = '';
    this.pwMsg = '';

    if (!this.pwForm.current) {
      this.pwErr = 'Enter your current password.';
      return;
    }
    if (this.pwForm.next.length < 8) {
      this.pwErr = 'New password must be at least 8 characters.';
      return;
    }
    if (this.pwForm.next !== this.pwForm.confirm) {
      this.pwErr = 'Passwords do not match.';
      return;
    }

    const saved = { ...this.pwForm };
    this.pwForm = { current: '', next: '', confirm: '' };
    this.showPw = [false, false, false];

    this.pwMsg = 'Password updated successfully.';

    this.svc.changePassword(saved.current, saved.next).subscribe({
      next: () => {},
      error: (err) => {
        this.pwMsg = '';
        this.pwErr = err.message;
        this.pwForm = saved;
      },
    });
  }

  // ── Card ─────────────────────────────────────────────────────────────────
  saveCard(): void {
    this.cardMsg = '';
    this.cardErr = '';

    const raw = this.newCard.cardNumber.replace(/\s/g, '');
    if (raw.length !== 16 || !/^\d+$/.test(raw)) {
      this.cardErr = 'Enter a valid 16-digit card number.';
      return;
    }
    if (!this.newCard.expiry.match(/^\d{2}\/\d{2}$/)) {
      this.cardErr = 'Enter expiry as MM/YY.';
      return;
    }
    if (!this.newCard.cardHolder.trim()) {
      this.cardErr = 'Enter the cardholder name.';
      return;
    }

    const prevCard = { ...this.card };
    const toSave = { ...this.newCard };

    this.card = { ...toSave };
    this.newCard = { cardNumber: '', cardHolder: '', expiry: '' };
    this.cardMsg = 'Card saved successfully.';

    this.svc.saveCard(toSave).subscribe({
      next: () => {},
      error: (err) => {
        this.card = prevCard;
        this.newCard = { ...toSave };
        this.cardMsg = '';
        this.cardErr = err.message;
      },
    });
  }

  removeCard(): void {
    const prevCard = { ...this.card };
    this.card = { cardNumber: '', cardHolder: '', expiry: '' };
    this.newCard = { cardNumber: '', cardHolder: '', expiry: '' };
    this.cardMsg = '';

    this.svc.removeCard().subscribe({
      next: () => {},
      error: (err) => {
        this.card = prevCard;
        this.cardErr = err.message;
      },
    });
  }

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
    this.newCard.cardNumber = el.value;
  }

  formatExpiry(event: Event): void {
    const el = event.target as HTMLInputElement;
    let raw = el.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length > 2) raw = raw.slice(0, 2) + '/' + raw.slice(2);
    el.value = raw;
    this.newCard.expiry = raw;
  }

  // ── Newsletter ────────────────────────────────────────────────────────────
  toggleNewsletter(): void {
    this.subscribed = !this.subscribed;
    const action$ = this.subscribed
      ? this.svc.subscribeNewsletter()
      : this.svc.unsubscribeNewsletter();
    action$.subscribe({
      next: () => {},
      error: (err) => {
        this.subscribed = !this.subscribed;
        alert(err.message);
      },
    });
  }

  // ── Account deletion ──────────────────────────────────────────────────────
  deleteAccount(): void {
    this.deleting = true;
    this.svc.deleteUser().subscribe({
      next: () => {
        this.svc.clearAuth();
        window.location.replace('/');
      },
      error: (err) => {
        this.deleting = false;
        alert(err.message);
      },
    });
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  logout(): void {
    this.svc.clearAuth();
    window.location.replace('/auth');
  }
}