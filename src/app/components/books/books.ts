import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Book } from '../../service/book';
import { Auths } from '../../service/auths';
import { books } from '../../controlers';
import { CommonModule } from '@angular/common';
import { Loader } from '../loader/loader';
import { BasketService } from '../../service/basket';
import { Router } from '@angular/router';

@Component({
  selector: 'app-books',
  imports: [CommonModule, Loader],
  templateUrl: './books.html',
  styleUrl: './books.scss',
})
export class Books implements OnInit {
  private api = inject(Book);

  private cdr = inject(ChangeDetectorRef);
  private basket = inject(BasketService);
  private router = inject(Router);

  books = signal<books[]>([]);
  loading = signal(true);
  error = signal('');
  selectedBook = signal<books | null>(null);
  showAuthModal = signal(false);

  // Toast
  toastBook = signal<books | null>(null);
  toastVisible = signal(false);
  private toastTimer: any;

  addToCart(book: books): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.showAuthModal.set(true);
      return;
    }

    this.basket.addItem(book.id, 1).subscribe({
      next: () => this.showToast(book),
      error: () => this.showToast(null),
    });
  }

  private showToast(book: books | null): void {
    clearTimeout(this.toastTimer);
    this.toastBook.set(book);
    this.toastVisible.set(true);
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), 3200);
  }

  closeModal(): void {
    this.showAuthModal.set(false);
  }
  goToAuth(): void {
    this.router.navigate(['/auth']);
  }
  dismissToast(): void {
    this.toastVisible.set(false);
  }

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
        this.books.set(merged);
        this.loading.set(false);
        this.cdr.detectChanges();
        setTimeout(() => this.initObserver(), 100);
      },
      error: () => {
        this.error.set('შეცდომა');
        this.loading.set(false);
      },
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
    document.querySelectorAll('[data-animate-repeat]').forEach((el) => observer.observe(el));
  }
}
