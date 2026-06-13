// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  message: string;
  userId: number;
  token: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// User / Profile
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Matches the actual API response from GET /api/User/get-user
 * NOTE: API returns `fullName` (not separate firstName/lastName),
 * `savedCardMasked`, `savedCardHolder`, `savedCardExpiry`, `isSubscribed`
 */
export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  userImgs: string | null;
  isVerified: boolean;
  savedCardMasked: string | null;
  savedCardHolder: string | null;
  savedCardExpiry: string | null;
  savedCardBrand: string | null;
  isSubscribed: boolean;
}

export interface UpdateProfileRequest {
  userId: number;
  fullName: string;
  phone: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Books
// ─────────────────────────────────────────────────────────────────────────────

export interface books {
  id: number;
  title: string;
  isbn: string;
  price: number;
  stock: number;
  bookUrl: string;
  categoryId: number;
  bookDetails?: {
    author?: string;
    description?: string;
    publisher?: string;
    pageCount?: number;
    publishedDate?: string;
    language?: string;
  } | null;
}

export interface BookOrder {
  id: number;
  bookUrl: string;
  title: string;
  isbn: string;
  price: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────────

export interface SaveCardRequest {
  userId: number;
  cardNumber: string;
  cardHolder: string;
  expiry: string;
}

export interface CardFormData {
  cardNumber: string;
  cardHolder: string;
  expiry: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment
// ─────────────────────────────────────────────────────────────────────────────

export interface PayRequest {
  userId: number;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
  exactAddress: string;
  amount: number;
}

export interface Payment {
  id: number;
  userId: number;
  cardHolderName: string;
  amount: number;
  exactAddress: string;
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Categories (legacy — keep for backwards compat)
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Use UserProfile instead */
export interface Category {
  id?: number;
  userUrl?: string;
  email: string | null;
  password: string | null;
  lastName: string | null;
  firstName: string | null;
  phone: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cart
// ─────────────────────────────────────────────────────────────────────────────

export interface AddToBasketRequest {
  userId: number;
  bookId: number;
  quantity: number;
}
export interface BasketBook {
  id: number;
  title: string;
  bookUrl: string;
  isbn: string;
  price: number;
  bookDetails?: { author?: string } | null;
}

export interface BasketItem {
  id: number;
  bookId: number;
  quantity: number;
  price: number;
  book: BasketBook;
}

export interface BasketGroup {
  id: number;
  total: number;
  items: BasketItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────────────────────


export interface AdminUser {
  fullName: string;
  email: string;
  token: string;
}

export interface DashboardStats {
  totalBooks: number;
  totalUsers: number;
  totalOrders: number;
  lowStockBooks: number;
  outOfStockBooks: number;
  newMessages: number;
}

export interface Book {
  id: number;
  title: string;
  isbn: string;
  price: number;
  stock: number;
  bookUrl: string;
  categoryId: number;
  bookDetails?: {
    author: string;
    description: string;
    publisher: string;
    pageCount: number;
    publishedDate: string;
    language: string;
  };
}

export interface AppUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  isVerified: boolean;
  userImgs: string;
  orderCount: number;
}

export interface Message {
  id: number;
  message?: string;
  text?: string;
  user?: { fullName: string; email: string };
}
export interface NewBook {
  title: string;
  isbn: string;
  price: number;
  stock: number;
  bookUrl: string;
  categoryId: number;
  author: string;
  description: string;
  publisher: string;
  pageCount: number;
  publishedDate: string;
  language: string;
}