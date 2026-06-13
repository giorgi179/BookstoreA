import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, forkJoin, switchMap, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Loader } from '../loader/loader';
import { BasketService } from '../../service/basket';
import { PaymentService, SavedCard } from '../../service/payment-service';
import { BasketGroup, BasketItem } from '../../controlers';

@Component({
  selector: 'app-basket',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, Loader],
  templateUrl: './basket.html',
  styleUrl: './basket.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('320ms cubic-bezier(0.22,1,0.36,1)',
          style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('listAnim', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(18px)' }),
          stagger(80, [
            animate('280ms cubic-bezier(0.22,1,0.36,1)',
              style({ opacity: 1, transform: 'translateY(0)' })),
          ]),
        ], { optional: true }),
        query(':leave', [
          animate('200ms ease', style({ opacity: 0, transform: 'scale(0.96)' })),
        ], { optional: true }),
      ]),
    ]),
    trigger('modalIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.92) translateY(12px)' }),
        animate('240ms cubic-bezier(0.22,1,0.36,1)',
          style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
      ]),
      transition(':leave', [
        animate('160ms ease', style({ opacity: 0, transform: 'scale(0.95)' })),
      ]),
    ]),
  ],
})
export class BasketComponent implements OnInit, OnDestroy {
  private svc        = inject(BasketService);
  private paymentSvc = inject(PaymentService);
  private router     = inject(Router);
  private fb         = inject(FormBuilder);
  private destroy$   = new Subject<void>();

  loading     = signal(true);
  removing    = signal<number | null>(null);
  clearing    = signal(false);
  checkingOut = signal(false);

  showCheckoutModal = signal(false);
  savedCard         = signal<SavedCard | null>(null);
  payError          = signal('');
  paying            = signal(false);

  checkoutForm!: FormGroup;
  groups: BasketGroup[] = [];

  private qtySubjects = new Map<number, Subject<{ basketId: number; bookId: number; qty: number }>>();

  get allItems(): BasketItem[] {
    return this.groups.flatMap(g => g.items);
  }
  get subtotal(): number {
    return this.allItems.reduce((s, i) => s + i.price * i.quantity, 0);
  }
  get totalItems(): number {
    return this.allItems.reduce((s, i) => s + i.quantity, 0);
  }
  private get email(): string {
    return localStorage.getItem('email') ?? '';
  }

  ngOnInit(): void {
    this.buildForm();
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    // CVV არ არის required — შენახული ბარათით გადახდისას backend-ი CVV-ს არ ითხოვს.
    // Delivery address კი საჭიროა.
    this.checkoutForm = this.fb.group({
      exactAddress: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  load(): void {
    this.loading.set(true);
    this.svc.getBaskets().subscribe({
      next:  data => { this.groups = data ?? []; this.loading.set(false); },
      error: ()   => { this.groups = [];          this.loading.set(false); },
    });
  }

  private getBasketId(itemId: number): number {
    return this.groups.find(g => g.items.some(i => i.id === itemId))?.id ?? 0;
  }

  updateQty(item: BasketItem, delta: number): void {
    const next = item.quantity + delta;
    if (next < 1) { this.removeItem(item); return; }
    item.quantity = next;

    if (!this.qtySubjects.has(item.id)) {
      const subject = new Subject<{ basketId: number; bookId: number; qty: number }>();
      this.qtySubjects.set(item.id, subject);
      subject.pipe(
        debounceTime(400),
        distinctUntilChanged((a, b) => a.qty === b.qty),
        takeUntil(this.destroy$),
      ).subscribe(({ basketId, bookId, qty }) => {
        this.svc.updateItem(basketId, bookId, qty).subscribe({ error: () => this.load() });
      });
    }
    this.qtySubjects.get(item.id)!.next({
      basketId: this.getBasketId(item.id),
      bookId: item.bookId,
      qty: next,
    });
  }

  removeItem(item: BasketItem): void {
    this.qtySubjects.get(item.id)?.complete();
    this.qtySubjects.delete(item.id);
    this.removing.set(item.id);
    this.groups = this.groups
      .map(g => ({ ...g, items: g.items.filter(i => i.id !== item.id) }))
      .filter(g => g.items.length > 0);
    this.svc.deleteItem(item.id).subscribe({
      next:  () => this.removing.set(null),
      error: () => { this.removing.set(null); this.load(); },
    });
  }

  clearAll(): void {
    if (!confirm('Remove all items from your cart?')) return;
    this.clearing.set(true);
    this.qtySubjects.forEach(s => s.complete());
    this.qtySubjects.clear();
    this.svc.clearBasket().subscribe({
      next:  () => { this.groups = []; this.clearing.set(false); },
      error: () => { this.clearing.set(false); },
    });
  }

  // ── Checkout entry point ───────────────────────────────────────────────────
  checkout(): void {
    if (this.checkingOut() || this.allItems.length === 0) return;
    this.checkingOut.set(true);
    this.payError.set('');

    // შევინახოთ items + total (price-ითაც) — /card გვერდსაც სჭირდება
    this.saveCheckoutState();

    this.paymentSvc.getSavedCard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (card) => {
          this.checkingOut.set(false);
          if (!card) {
            this.router.navigate(['/card']);
          } else {
            this.savedCard.set(card);
            this.checkoutForm.reset();
            this.showCheckoutModal.set(true);
          }
        },
        error: () => {
          this.checkingOut.set(false);
          this.router.navigate(['/card']);
        },
      });
  }

  /** შეინახე კალათის მდგომარეობა localStorage-ში checkout flow-სთვის */
  private saveCheckoutState(): void {
    localStorage.setItem('checkoutTotal', String(this.subtotal));
    localStorage.setItem(
      'checkoutItems',
      JSON.stringify(
        this.allItems.map(i => ({
          bookId:   i.bookId,
          quantity: i.quantity,
          price:    i.price,   // ← unit price — per-item amount-ისთვის
        })),
      ),
    );
  }

  closeModal(): void {
    if (this.paying()) return;
    this.showCheckoutModal.set(false);
    this.payError.set('');
  }

  useDifferentCard(): void {
    this.showCheckoutModal.set(false);
    this.saveCheckoutState();
    this.router.navigate(['/card']);
  }

  // ── Pay with saved card ───────────────────────────────────────────────────
  confirmPay(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }
    const card = this.savedCard();
    if (!card) return;

    this.paying.set(true);
    this.payError.set('');

    const { exactAddress } = this.checkoutForm.value;
    const itemsSnapshot = [...this.allItems];
    const total = this.subtotal;

    // ── Step 1: გადახდა — თითოეული book-ისთვის ცალკე call bookId-ით ──────
    //
    // API: POST /api/Payment/pay?userId&bookId&cardNumber&cardHolderName
    //                           &expiryDate&cvv&exactAddress&amount
    //
    // შენახული ბარათით გადახდისას CVV-ი "000"-ით ივსება,
    // რადგან backend-ი masked ბარათისთვის CVV-ს არ ამოწმებს.
    const SAVED_CARD_CVV = '000';

    const paymentCalls = itemsSnapshot.length > 0
      ? itemsSnapshot.map(item =>
          this.paymentSvc.pay(
            card.cardNumber,
            card.cardHolderName,
            card.expiryDate,
            SAVED_CARD_CVV,
            exactAddress,
            item.price * item.quantity,   // ← ზუსტი თანხა item-ისთვის
            item.bookId,                  // ← bookId — purchases-ში გამოჩნდება
          )
        )
      : [
          this.paymentSvc.pay(
            card.cardNumber, card.cardHolderName, card.expiryDate,
            SAVED_CARD_CVV, exactAddress, total,
          ),
        ];

    forkJoin(paymentCalls)
      .pipe(
        takeUntil(this.destroy$),

        // ── Step 2: stock შემცირება ────────────────────────────────────────
        switchMap(() => {
          const stockCalls = itemsSnapshot.map(item =>
            this.svc.decreaseStock(item.bookId, this.email, item.quantity)
              .pipe(catchError(() => of(null))),  // ერთი შეცდომა სხვებს არ შეაჩერებს
          );
          return stockCalls.length > 0 ? forkJoin(stockCalls) : of([]);
        }),

        // ── Step 3: კალათის გასუფთავება ───────────────────────────────────
        switchMap(() => this.svc.clearBasket().pipe(catchError(() => of(null)))),
      )
      .subscribe({
        next: () => {
          this.paying.set(false);
          this.showCheckoutModal.set(false);
          localStorage.removeItem('checkoutItems');
          localStorage.removeItem('checkoutTotal');
          this.qtySubjects.forEach(s => s.complete());
          this.qtySubjects.clear();
          this.groups = [];
          // წარმატებული checkout-ის შემდეგ ბიბლიოთეკაში გადაამისამართე
          this.router.navigate(['/profile'], { queryParams: { tab: 'library' } });
        },
        error: (e: Error) => {
          this.paying.set(false);
          this.payError.set(e.message);
        },
      });
  }

  errField(field: string): boolean {
    const c = this.checkoutForm.get(field);
    return !!(c?.invalid && c?.touched);
  }
}