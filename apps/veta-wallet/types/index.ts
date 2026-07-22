export interface WalletUser {
  id: string;
  gid: string;
  email: string;
  fullName?: string | null;
  balance: string | number;
}

export interface WalletTransaction {
  id: string;
  direction: 'in' | 'out';
  fromGid: string | null;
  toGid: string;
  amount: string | number;
  type: 'transfer' | 'welcome_bonus';
  description?: string | null;
  status: 'completed' | 'failed';
  createdAt: string;
}
