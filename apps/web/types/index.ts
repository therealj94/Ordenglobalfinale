// User types
export interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  role?: 'user' | 'admin';
  gid?: string | null;
  createdAt: string;
  lastLogin?: string;
}

// Verification types
export interface Verification {
  id: string;
  userId: string;
  sessionId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'abandoned';
  documentType?: string;
  verifiedAt?: string;
  expiresAt?: string;
  rawData?: Record<string, any>;
  rejectionReason?: string;
  createdAt: string;
}

// Auth types
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  fullName?: string;
  phone?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface ManualReviewCase {
  id: string;
  verificationId: string;
  userId: string;
  user: User;
  verification: Verification;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}
