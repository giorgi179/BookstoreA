import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { Book } from '../../service/book';
import { Auths } from '../../service/auths';
import { books } from '../../controlers';
import { CommonModule } from '@angular/common';
import { Loader } from "../loader/loader";

@Component({
  selector: 'app-events',
  imports: [CommonModule, Loader],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class Events implements OnInit {
  private api = inject(Book);
  private auth = inject(Auths);
  private cdr = inject(ChangeDetectorRef);

  books = signal<books[]>([]);
  loading = signal(true);
  error = signal('');
  selectedBook = signal<books | null>(null);
  showAuthModal = signal(false);

  addToCart(book: books): void {
    const userId = this.auth.getToken();
    if (!userId) {
      this.showAuthModal.set(true);
      return;
    }
    // TODO: cart logic
  }

  closeModal(): void {
    this.showAuthModal.set(false);
  }

  goToAuth(): void {
    window.location.href = '/auth';
  }

  ngOnInit(): void {
    this.api.getBooks().subscribe({
      next: (data) => {
        this.books.set(data.slice(0, 3));
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
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          } else {
            entry.target.classList.remove('is-visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );
    document.querySelectorAll('[data-animate-repeat]').forEach((el) => {
      observer.observe(el);
    });
  }
}