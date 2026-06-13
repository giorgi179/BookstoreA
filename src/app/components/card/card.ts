import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject, takeUntil, finalize, switchMap, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { PaymentService, SavedCard } from '../../service/payment-service';
import { BasketService } from '../../service/basket';

export type CardView = 'loading' | 'form' | 'success';

interface CheckoutItem {
  bookId: number;
  quantity: number;
  price: number; // unit price — needed for per-book amount
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './card.html',
  styleUrl: './card.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate(
          '320ms cubic-bezier(0.22,1,0.36,1)',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
    ]),
  ],
})
export class Card implements OnInit, OnDestroy {
  private paymentSvc = inject(PaymentService);
  private basketSvc = inject(BasketService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  view = signal<CardView>('loading');
  saving = signal(false);
  deleting = signal(false);
  cardFlip = signal(false);
  savedCard = signal<SavedCard | null>(null);
  errorMsg = signal('');

  // ── Checkout data ─────────────────────────────────────────────────────────
  get totalAmount(): number {
    return Number(localStorage.getItem('checkoutTotal') ?? 0);
  }

  private get checkoutItems(): CheckoutItem[] {
    try {
      return JSON.parse(localStorage.getItem('checkoutItems') ?? '[]');
    } catch {
      return [];
    }
  }

  private get email(): string {
    return localStorage.getItem('email') ?? '';
  }

  form!: FormGroup;

  // ── Card preview getters ──────────────────────────────────────────────────
  get previewNumber(): string {
    const raw = (this.form?.get('cardNumber')?.value ?? '').replace(/\D/g, '');
    return raw.padEnd(16, '·').match(/.{1,4}/g)!.join('  ');
  }
  get previewHolder(): string {
    return this.form?.get('cardHolderName')?.value?.toUpperCase() || '';
  }
  get previewExpiry(): string {
    return this.form?.get('expiryDate')?.value || '';
  }
  get previewCvv(): string {
    return this.form?.get('cvv')?.value || '';
  }

  ngOnInit(): void {
    this.buildForm();
    this.loadCard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      cardNumber:     ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      cardHolderName: ['', [Validators.required, Validators.minLength(2)]],
      expiryDate:     ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cvv:            ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      exactAddress:   ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  private loadCard(): void {
    this.view.set('loading');
    this.paymentSvc
      .getSavedCard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  (c) => { this.savedCard.set(c); this.view.set('form'); },
        error: ()  => { this.savedCard.set(null); this.view.set('form'); },
      });
  }

  // ── Payment flow ──────────────────────────────────────────────────────────
  saveCard(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMsg.set('');
    this.saving.set(true);

    const { cardNumber, cardHolderName, expiryDate, cvv, exactAddress } = this.form.value;
    const items = this.checkoutItems;

    /**
     * Build one payment call per basket item, each with its own bookId.
     * Amount per item = unit price × quantity (or falls back to even split).
     */
    const buildPaymentCalls = () => {
      if (items.length === 0) {
        // No item metadata — single payment without bookId
        return [
          this.paymentSvc.pay(
            cardNumber, cardHolderName, expiryDate,
            cvv, exactAddress, this.totalAmount,
          ),
        ];
      }

      return items.map((item) => {
        // Use per-item price if available, otherwise split total evenly
        const itemAmount =
          item.price != null
            ? item.price * item.quantity
            : this.totalAmount / items.length;

        return this.paymentSvc.pay(
          cardNumber,
          cardHolderName,
          expiryDate,
          cvv,
          exactAddress,
          itemAmount,
          item.bookId,   // ← bookId required by API
        );
      });
    };

    // Step 1: save card
    this.paymentSvc
      .saveCard(cardNumber, cardHolderName, expiryDate)
      .pipe(
        takeUntil(this.destroy$),

        // Step 2: pay for each item (parallel, bookId-aware)
        switchMap(() => forkJoin(buildPaymentCalls())),

        // Step 3: decrease stock per item
        switchMap(() => {
          if (items.length === 0) return of([]);
          const stockCalls = items.map((item) =>
            this.basketSvc
              .decreaseStock(item.bookId, this.email, item.quantity)
              .pipe(catchError(() => of(null))),
          );
          return forkJoin(stockCalls);
        }),

        // Step 4: clear basket
        switchMap(() => this.basketSvc.clearBasket().pipe(catchError(() => of(null)))),

        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          localStorage.removeItem('checkoutItems');
          localStorage.removeItem('checkoutTotal');
          this.form.reset();
          this.view.set('success');
        },
        error: (e: Error) => {
          this.errorMsg.set(e.message);
        },
      });
  }

  // ── Remove saved card ─────────────────────────────────────────────────────
  removeCard(): void {
    const card = this.savedCard();
    if (!card || this.deleting()) return;
    this.deleting.set(true);

    this.paymentSvc
      .deleteCard(card.id)
      .pipe(takeUntil(this.destroy$), finalize(() => this.deleting.set(false)))
      .subscribe({
        next:  () => { this.savedCard.set(null); },
        error: (e: Error) => { this.errorMsg.set(e.message); },
      });
  }

  // ── Form helpers ──────────────────────────────────────────────────────────
  err(field: string): boolean {
    const c: AbstractControl | null = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onCardInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 16);
    this.form.get('cardNumber')!.setValue(v, { emitEvent: true });
  }

  onExpiryInput(e: Event): void {
    const el = e.target as HTMLInputElement;
    let v = el.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    this.form.get('expiryDate')!.setValue(v, { emitEvent: true });
    el.value = v;
  }

  onCvvFocus(): void { this.cardFlip.set(true); }
  onCvvBlur():  void { this.cardFlip.set(false); }
}