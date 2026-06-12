import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { Loader } from '../loader/loader';
import { BasketService } from '../../service/basket';
import { BasketGroup, BasketItem } from '../../controlers';

@Component({
  selector: 'app-basket',
  standalone: true,
  imports: [CommonModule, RouterModule, Loader],
  templateUrl: './basket.html',
  styleUrl: './basket.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('320ms cubic-bezier(0.22,1,0.36,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('listAnim', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(18px)' }),
          stagger(80, [
            animate('280ms cubic-bezier(0.22,1,0.36,1)', style({ opacity: 1, transform: 'translateY(0)' })),
          ]),
        ], { optional: true }),
        query(':leave', [
          animate('200ms ease', style({ opacity: 0, transform: 'scale(0.96)' })),
        ], { optional: true }),
      ]),
    ]),
  ],
})
export class BasketComponent implements OnInit {
  private svc = inject(BasketService);

  loading  = signal(true);
  removing = signal<number | null>(null);
  clearing = signal(false);

  groups: BasketGroup[] = [];

  private qtySubjects = new Map<number, Subject<{ basketId: number; bookId: number; qty: number }>>();

  get allItems(): BasketItem[] {
    return this.groups.flatMap((g: BasketGroup) => g.items);
  }

  get subtotal(): number {
    return this.allItems.reduce((s: number, i: BasketItem) => s + i.price * i.quantity, 0);
  }

  get totalItems(): number {
    return this.allItems.reduce((s: number, i: BasketItem) => s + i.quantity, 0);
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getBaskets().subscribe({
      next:  (data: BasketGroup[]) => { this.groups = data ?? []; this.loading.set(false); },
      error: ()                    => { this.groups = [];          this.loading.set(false); },
    });
  }

  // find which BasketGroup contains this item
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
      ).subscribe(({ basketId, bookId, qty }) => {
        this.svc.updateItem(basketId, bookId, qty).subscribe({
          error: () => this.load(),
        });
      });
    }

    this.qtySubjects.get(item.id)!.next({
      basketId: this.getBasketId(item.id),
      bookId:   item.bookId,
      qty:      next,
    });
  }

  removeItem(item: BasketItem): void {
    this.qtySubjects.get(item.id)?.complete();
    this.qtySubjects.delete(item.id);

    this.removing.set(item.id);
    this.groups = this.groups
      .map((g: BasketGroup) => ({ ...g, items: g.items.filter((i: BasketItem) => i.id !== item.id) }))
      .filter((g: BasketGroup) => g.items.length > 0);

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
}