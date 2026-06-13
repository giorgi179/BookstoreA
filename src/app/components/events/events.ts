import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Book } from '../../service/book';
import { Auths } from '../../service/auths';
import { books } from '../../controlers';
import { CommonModule } from '@angular/common';
import { Loader } from '../loader/loader';
import { BasketService } from '../../service/basket';

@Component({
  selector: 'app-events',
  imports: [CommonModule, Loader],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class Events implements OnInit {
  private api    = inject(Book);
  private auth   = inject(Auths);
  private cdr    = inject(ChangeDetectorRef);
  private basket = inject(BasketService);

  books         = signal<books[]>([]);
  loading       = signal(true);
  error         = signal('');
  selectedBook  = signal<books | null>(null);
  showAuthModal = signal(false);

  // Toast
  toastBook    = signal<books | null>(null);
  toastVisible = signal(false);
  private toastTimer: any;

  addToCart(book: books): void {
    const userId = localStorage.getItem('userId');
    if (!userId) { this.showAuthModal.set(true); return; }

    this.basket.addItem(book.id, 1).subscribe({
      next:  () => this.showToast(book),
      error: () => this.showToast(null),
    });
  }

  private showToast(book: books | null): void {
    clearTimeout(this.toastTimer);
    this.toastBook.set(book);
    this.toastVisible.set(true);
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), 3200);
  }

  closeModal():   void { this.showAuthModal.set(false); }
  goToAuth():     void { window.location.href = '/auth'; }
  dismissToast(): void { this.toastVisible.set(false); }

  ngOnInit(): void {
    forkJoin({
      books: this.api.getBooks(),
      details: this.api.getBookDetails(),
    }).subscribe({
      next: ({ books, details }) => {
        const merged = books.map((book) => ({
          ...book,
          bookDetails: details.find((d) => d.bookId === book.id) ?? null,
        }));
        this.books.set(merged.slice(0, 3));
        this.loading.set(false);
        this.cdr.detectChanges();
        setTimeout(() => this.initObserver(), 100);
      },
      error: () => { this.error.set('შეცდომა'); this.loading.set(false); },
    });
  }

  openDetail(book: books): void {
    this.selectedBook.set(book);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeDetail(): void {
    this.selectedBook.set(null);
    this.cdr.detectChanges();
    setTimeout(() => this.initObserver(), 100);
  }

  private initObserver(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
          else entry.target.classList.remove('is-visible');
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );
    document.querySelectorAll('[data-animate-repeat]').forEach(el => observer.observe(el));
  }
}