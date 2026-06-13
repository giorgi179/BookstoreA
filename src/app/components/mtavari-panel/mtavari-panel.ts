import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminLoginService } from '../../service/admin-login';
import { AdminService } from '../../service/admin';
import { Book, Message, NewBook } from '../../controlers';

type Tab = 'dashboard' | 'books' | 'users' | 'messages';

@Component({
  selector: 'app-mtavari-panel',
  standalone: true,
  imports: [DecimalPipe, NgClass, FormsModule],
  templateUrl: './mtavari-panel.html',
  styleUrl: './mtavari-panel.scss',
})
export class MtavariPanel implements OnInit {
  readonly svc = inject(AdminService);
  readonly auth = inject(AdminLoginService);

  activeTab = signal<Tab>('dashboard');

  bookSearch = signal('');
  userSearch = signal('');

  editingStockId = signal<number | null>(null);
  stockValue = signal(0);

  confirmDelete = signal<{ type: string; id: number } | null>(null);

  // ── Add book ──────────────────────────────
  showAddBook = signal(false);
  addBookError = signal<string | null>(null);
  addBookLoading = signal(false);

  newBook = signal<NewBook>({
    title: '',
    isbn: '',
    price: 0,
    stock: 0,
    bookUrl: '',
    categoryId: 1,
    author: '',
    description: '',
    publisher: '',
    pageCount: 0,
    publishedDate: new Date().toISOString(),
    language: 'ქართული',
  });

  readonly filteredBooks = computed(() => {
    const q = this.bookSearch().toLowerCase();
    return this.svc
      .books()
      .filter((b) => b.title.toLowerCase().includes(q) || b.isbn?.toLowerCase().includes(q));
  });

  readonly filteredUsers = computed(() => {
    const q = this.userSearch().toLowerCase();
    return this.svc
      .users()
      .filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  });

  ngOnInit() {
    if (!this.auth.isLoggedIn()) return;

    this.svc.loadDashboard().subscribe();
    this.svc.loadBooks().subscribe();
    this.svc.loadUsers().subscribe();
    this.svc.loadMessages().subscribe();
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);

    if (tab === 'books' && this.svc.books().length === 0) this.svc.loadBooks().subscribe();
    if (tab === 'users' && this.svc.users().length === 0) this.svc.loadUsers().subscribe();
    if (tab === 'messages' && this.svc.messages().length === 0) this.svc.loadMessages().subscribe();
  }

  // ── Books ─────────────────────────────────
  startEditStock(book: Book) {
    this.editingStockId.set(book.id);
    this.stockValue.set(book.stock);
  }

  saveStock(id: number) {
    this.svc.updateStock(id, this.stockValue()).subscribe(() => {
      this.editingStockId.set(null);
    });
  }

  cancelStock() {
    this.editingStockId.set(null);
  }

  // ── Add book ──────────────────────────────
  openAddBook() {
    this.newBook.set({
      title: '',
      isbn: '',
      price: 0,
      stock: 0,
      bookUrl: '',
      categoryId: 1,
      author: '',
      description: '',
      publisher: '',
      pageCount: 0,
      publishedDate: new Date().toISOString(),
      language: 'ქართული',
    });
    this.addBookError.set(null);
    this.showAddBook.set(true);
  }

  closeAddBook() {
    this.showAddBook.set(false);
    this.addBookError.set(null);
  }

  updateNewBook<K extends keyof NewBook>(field: K, value: NewBook[K]) {
    this.newBook.update((b) => ({ ...b, [field]: value }));
  }

  submitAddBook() {
    const book = this.newBook();

    if (!book.title.trim()) {
      this.addBookError.set('სათაური სავალდებულოა');
      return;
    }
    if (!book.isbn.trim()) {
      this.addBookError.set('ISBN სავალდებულოა');
      return;
    }
    if (book.price <= 0) {
      this.addBookError.set('ფასი უნდა იყოს დადებითი');
      return;
    }

    this.addBookLoading.set(true);
    this.addBookError.set(null);

    this.svc.addBook(book).subscribe({
      next: () => {
        this.addBookLoading.set(false);
        this.showAddBook.set(false);
      },
      error: (err) => {
        this.addBookLoading.set(false);
        this.addBookError.set(
          typeof err.error === 'string' ? err.error : 'წიგნის დამატება ვერ მოხერხდა',
        );
      },
    });
  }

  // ── Delete ────────────────────────────────
  askDelete(type: string, id: number) {
    this.confirmDelete.set({ type, id });
  }
  cancelDelete() {
    this.confirmDelete.set(null);
  }

  doDelete() {
    const d = this.confirmDelete();
    if (!d) return;
    const obs =
      d.type === 'book'
        ? this.svc.deleteBook(d.id)
        : d.type === 'user'
          ? this.svc.deleteUser(d.id)
          : d.type === 'message'
            ? this.svc.deleteMessage(d.id)
            : null;
    obs?.subscribe(() => this.confirmDelete.set(null));
  }

  // ── Users ─────────────────────────────────
  verify(id: number) {
    this.svc.verifyUser(id).subscribe();
  }

  // ── Auth ──────────────────────────────────
  logout() {
    this.auth.logout();
  }

  stockColor(stock: number): string {
    if (stock === 0) return 'danger';
    if (stock < 5) return 'warn';
    return 'ok';
  }

  // ── Template helpers ──────────────────────
  msgId(msg: Message): number {
    return msg.id;
  }
  msgName(msg: Message): string {
    return msg.user?.fullName ?? 'უცნობი';
  }
  msgEmail(msg: Message): string {
    return msg.user?.email ?? '';
  }
  msgBody(msg: Message): string {
    return msg.message ?? msg.text ?? '—';
  }
  msgAvatar(msg: Message): string {
    return (msg.user?.fullName?.charAt(0) ?? '?').toUpperCase();
  }
}
