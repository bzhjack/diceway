export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  email_verified_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

export interface RegisterResponse {
  user: AuthUser;
}

export interface ApiMessageResponse {
  message: string;
}
