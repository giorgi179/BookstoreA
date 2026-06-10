// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email:    string;
  password: string;
}

export interface TokenResponse {
  message: string;
  userId:  number;
  token:   string;
}

export interface ResetPasswordRequest {
  email:       string;
  code:        string;
  newPassword: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// User / Profile
// ─────────────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id:          number;
  email:       string;
  firstName:   string;
  lastName:    string;
  phone:       string;
  cardNumber?: string;
  cardHolder?: string;
  expiry?:     string;
  subscribed?: boolean;
}

export interface UpdateProfileRequest {
  userId:   number;
  fullName: string;
  phone:    string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Books
// ─────────────────────────────────────────────────────────────────────────────

export interface books {
  id:          number;
  bookUrl:     string;
  title:       string;
  isbn:        string;
  price:       number;
  categoryId:  number;
  stock:       number;
  bookDetails: null;
}

export interface BookOrder {
  id:      number;
  bookUrl: string;
  title:   string;
  isbn:    string;
  price:   number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────────

export interface SaveCardRequest {
  userId:     number;
  cardNumber: string;
  cardHolder: string;
  expiry:     string;
}

export interface CardFormData {
  cardNumber: string;
  cardHolder: string;
  expiry:     string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment
// ─────────────────────────────────────────────────────────────────────────────

export interface PayRequest {
  userId:         number;
  cardNumber:     string;
  cardHolderName: string;
  expiryDate:     string;
  cvv:            string;
  exactAddress:   string;
  amount:         number;
}

export interface Payment {
  id:             number;
  userId:         number;
  cardHolderName: string;
  amount:         number;
  exactAddress:   string;
  createdAt?:     string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Categories (legacy — keep for backwards compat)
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated  Rename to UserProfile — this shape was incorrectly typed as
 *  "categories" in the original codebase. */
export interface Category {
  id?:        number;
  userUrl?:   string;
  email:      string | null;
  password:   string | null;
  lastName:   string | null;
  firstName:  string | null;
  phone:      string | null;
}
