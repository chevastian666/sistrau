import { User } from './index';

export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  companyId?: string;
  phone?: string;
}