export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  token_type: string;
  user: User;
}

export interface Profile {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  features: string[];
}

export interface Subscription {
  id: number;
  plan: SubscriptionPlan;
  status: string;
  expires_at: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
