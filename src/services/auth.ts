import { request, setAuthToken, setCurrentUser, setRefreshToken } from './client';
import type { User } from './types';

export async function login(credentials: { email: string; password?: string }): Promise<{ token: string; user: User }> {
  const data = await request<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  setAuthToken(data.token);
  if (data.refresh_token) {
    setRefreshToken(data.refresh_token);
  }
  const roleMap: Record<string, 'admin' | 'staff' | 'user'> = { ADMIN: 'admin', STAFF: 'staff', USER: 'user' };
  const userObj: User = {
    first_name: data.user?.first_name || 'Guest',
    last_name: data.user?.last_name || '',
    email: data.user?.email || data.email,
    phone: data.user?.phone,
    role: roleMap[data.user?.user_type] || 'user'
  };
  setCurrentUser(userObj);
  return { token: data.token, user: userObj };
}

export async function signup(user: { first_name: string; last_name: string; email: string; password?: string; phone: string; user_type: string }): Promise<{ token: string; user: User }> {
  const data = await request<any>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(user)
  });
  setAuthToken(data.token);
  if (data.refresh_token) {
    setRefreshToken(data.refresh_token);
  }
  const roleMap: Record<string, 'admin' | 'staff' | 'user'> = { ADMIN: 'admin', STAFF: 'staff', USER: 'user' };
  const userObj: User = {
    first_name: data.user?.first_name,
    last_name: data.user?.last_name,
    email: data.user?.email,
    phone: data.user?.phone,
    role: roleMap[data.user?.user_type] || 'user'
  };
  setCurrentUser(userObj);
  return { token: data.token, user: userObj };
}

export async function fetchCurrentUser(): Promise<any> {
  return request<any>('/auth/user');
}
