import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { DecimalPipe, NgClass, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminLoginService } from '../../service/admin-login';
import { AdminService } from '../../service/admin';
import { Book, BasketGroup, BasketItem, Message, NewBook, Payment } from '../../controlers';

type Tab = 'dashboard' | 'books' | 'users' | 'messages' | 'baskets' | 'payments' | 'categories';

@Component({
  selector: 'app-mtavari-panel',
  standalone: true,
  imports: [DecimalPipe, NgClass, FormsModule, DatePipe],
  templateUrl: './mtavari-panel.html',
  styleUrl: './mtavari-panel.scss',
})
export class MtavariPanel implements OnInit {
  readonly svc = inject(AdminService);
  readonly auth = inject(AdminLoginService);

  activeTab = signal<Tab>('dashboard');

  bookSearch = signal('');
  userSearch = signal('');
  paymentSearch = signal('');

  // ── Book editing ──────────────────────────────────────────────────────────
  editingStockId = signal<number | null>(null);
  stockValue = signal(0);

  showEditBook = signal(false);
  editingBook = signal<Book | null>(null);

  // ── Add book ──────────────────────────────────────────────────────────────
  showAddBook = signal(false);
  addBookError = signal<string | null>(null);
  addBookLoading = signal(false);

  showAddCategory = signal(false);
  newCategoryName = signal('');
  editingCategoryId = signal<number | null>(null);
  editingCategoryName = signal('');

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

  // ── Basket expand ─────────────────────────────────────────────────────────
  expandedBasketId = signal<number | null>(null);
  editingItemId = signal<number | null>(null);
  itemQtyValue = signal(0);

  // ── Payment status edit ───────────────────────────────────────────────────
  editingPaymentId = signal<number | null>(null);
  paymentStatusVal = signal('');

  // ── Confirm delete ────────────────────────────────────────────────────────
  confirmDelete = signal<{ type: string; id: number; extra?: number } | null>(null);

  // ── Show subscribers toggle ───────────────────────────────────────────────
  showSubscribers = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly filteredBooks = computed(() => {
    const q = this.bookSearch().toLowerCase();
    return this.svc
      .books()
      .filter((b) => b.title.toLowerCase().includes(q) || b.isbn?.toLowerCase().includes(q));
  });

  readonly filteredUsers = computed(() => {
    const q = this.userSearch().toLowerCase();
    const list = this.showSubscribers() ? this.svc.subscribers() : this.svc.users();
    return list.filter(
      (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  });

  readonly filteredPayments = computed(() => {
    const q = this.paymentSearch().toLowerCase();
    return this.svc
      .payments()
      .filter(
        (p) =>
          p.cardHolderName?.toLowerCase().includes(q) ||
          p.exactAddress?.toLowerCase().includes(q) ||
          String(p.id).includes(q),
      );
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit() {
    if (!this.auth.isLoggedIn()) return;
    this.svc.loadDashboard().subscribe();
    this.svc.loadBooks().subscribe();
    this.svc.loadUsers().subscribe();
    this.svc.loadMessages().subscribe();
    this.svc.loadBaskets().subscribe();
    this.svc.loadPayments().subscribe();
    this.svc.loadCategories().subscribe();
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
    if (tab === 'books' && !this.svc.books().length) this.svc.loadBooks().subscribe();
    if (tab === 'users' && !this.svc.users().length) this.svc.loadUsers().subscribe();
    if (tab === 'messages' && !this.svc.messages().length) this.svc.loadMessages().subscribe();
    if (tab === 'baskets' && !this.svc.baskets().length) this.svc.loadBaskets().subscribe();
    if (tab === 'payments' && !this.svc.payments().length) this.svc.loadPayments().subscribe();
    if (tab === 'categories' && !this.svc.categories().length)
      this.svc.loadCategories().subscribe();
  }

  // ── Books ─────────────────────────────────────────────────────────────────
  startEditStock(book: Book) {
    this.editingStockId.set(book.id);
    this.stockValue.set(book.stock);
  }
  saveStock(id: number) {
    this.svc.updateStock(id, this.stockValue()).subscribe(() => this.editingStockId.set(null));
  }
  cancelStock() {
    this.editingStockId.set(null);
  }

  openEditBook(book: Book) {
    this.editingBook.set({ ...book });
    this.showEditBook.set(true);
  }
  closeEditBook() {
    this.showEditBook.set(false);
    this.editingBook.set(null);
  }

  updateEditBook<K extends keyof Book>(field: K, value: Book[K]) {
    this.editingBook.update((b) => (b ? { ...b, [field]: value } : b));
  }

  submitEditBook() {
    const b = this.editingBook();
    if (!b) return;
    const payload: NewBook = {
      title: b.title,
      isbn: b.isbn,
      price: b.price,
      stock: b.stock,
      bookUrl: b.bookUrl,
      categoryId: b.categoryId,
      author: b.bookDetails?.author ?? '',
      description: b.bookDetails?.description ?? '',
      publisher: b.bookDetails?.publisher ?? '',
      pageCount: b.bookDetails?.pageCount ?? 0,
      publishedDate: b.bookDetails?.publishedDate ?? new Date().toISOString(),
      language: b.bookDetails?.language ?? '',
    };
    this.svc.updateBook(b.id, payload).subscribe(() => this.closeEditBook());
  }

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
  updateEditBookLanguage(value: string) {
    this.editingBook.update((b) =>
      b ? { ...b, bookDetails: { ...b.bookDetails, language: value } as any } : b,
    );
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
    if (!book.author.trim()) {
      this.addBookError.set('ავტორი სავალდებულოა');
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

  // ── Users ─────────────────────────────────────────────────────────────────
  verify(id: number) {
    this.svc.verifyUser(id).subscribe();
  }
  unverify(id: number) {
    this.svc.unverifyUser(id).subscribe();
  }

  toggleSubscribers() {
    this.showSubscribers.update((v) => !v);
    if (this.showSubscribers() && !this.svc.subscribers().length) {
      this.svc.loadSubscribers().subscribe();
    }
  }

  // ── Baskets ───────────────────────────────────────────────────────────────
  toggleBasket(id: number) {
    this.expandedBasketId.update((cur) => (cur === id ? null : id));
  }

  startEditItem(item: BasketItem) {
    this.editingItemId.set(item.id);
    this.itemQtyValue.set(item.quantity);
  }
  cancelEditItem() {
    this.editingItemId.set(null);
  }

  saveItemQty(itemId: number, basketId: number) {
    this.svc
      .updateBasketItem(itemId, basketId, this.itemQtyValue())
      .subscribe(() => this.editingItemId.set(null));
  }

  // ── Payments ──────────────────────────────────────────────────────────────
  startEditStatus(p: Payment & { status?: string }) {
    this.editingPaymentId.set(p.id);
    this.paymentStatusVal.set((p as any).status ?? 'Pending');
  }
  cancelEditStatus() {
    this.editingPaymentId.set(null);
  }

  saveStatus(id: number) {
    this.svc
      .updatePaymentStatus(id, this.paymentStatusVal())
      .subscribe(() => this.editingPaymentId.set(null));
  }

  statusColor(status: string | undefined): string {
    switch ((status ?? '').toLowerCase()) {
      case 'paid':
        return 'ok';
      case 'pending':
        return 'warn';
      case 'failed':
        return 'danger';
      default:
        return 'muted';
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  askDelete(type: string, id: number, extra?: number) {
    this.confirmDelete.set({ type, id, extra });
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
          : d.type === 'userCard'
            ? this.svc.deleteUserCard(d.id)
            : d.type === 'message'
              ? this.svc.deleteMessage(d.id)
              : d.type === 'category'
                ? this.svc.deleteCategory(d.id)
                : d.type === 'basket'
                  ? this.svc.deleteBasket(d.id)
                  : d.type === 'basketItem'
                    ? this.svc.deleteBasketItem(d.id, d.extra!)
                    : d.type === 'payment'
                      ? this.svc.deletePayment(d.id)
                      : null;

    obs?.subscribe(() => this.confirmDelete.set(null));
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  logout() {
    this.auth.logout();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  stockColor(stock: number): string {
    if (stock === 0) return 'danger';
    if (stock < 5) return 'warn';
    return 'ok';
  }

  basketTotal(b: BasketGroup): number {
    return b.items.reduce((s, i) => s + i.price * i.quantity, 0);
  }

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
  submitAddCategory() {
    const name = this.newCategoryName().trim();
    if (!name) return;
    this.svc.addCategory(name).subscribe(() => {
      this.newCategoryName.set('');
      this.showAddCategory.set(false);
    });
  }

  startEditCategory(cat: { id: number; name: string }) {
    this.editingCategoryId.set(cat.id);
    this.editingCategoryName.set(cat.name);
  }

  saveCategory() {
    const id = this.editingCategoryId();
    if (!id) return;
    this.svc
      .updateCategory(id, this.editingCategoryName())
      .subscribe(() => this.editingCategoryId.set(null));
  }

  cancelEditCategory() {
    this.editingCategoryId.set(null);
  }
}
