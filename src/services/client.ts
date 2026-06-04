import type { User } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Auth token helpers
export const setAuthToken = (token: string) => {
  localStorage.setItem('restro_token', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('restro_token');
};

export const removeAuthToken = () => {
  localStorage.removeItem('restro_token');
  localStorage.removeItem('restro_refresh_token');
};

export const setRefreshToken = (token: string) => {
  localStorage.setItem('restro_refresh_token', token);
};

export const getRefreshToken = () => {
  return localStorage.getItem('restro_refresh_token');
};

export const removeRefreshToken = () => {
  localStorage.removeItem('restro_refresh_token');
};

// Current user helpers
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('restro_user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('restro_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('restro_user');
  }
};

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (newToken: string | null) => {
  refreshQueue.forEach((callback) => callback(newToken || ''));
  refreshQueue = [];
};

// Generic HTTP Request helper accepting custom options and returning generic type T
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  // Set Auth Token if available
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const isFormData = options.body instanceof FormData;

  // Only set application/json if we are NOT sending FormData and if Content-Type is not already specified
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Handle request body: stringify object payloads if not already string/FormData
  let requestBody = options.body;
  if (requestBody && !isFormData && typeof requestBody === 'object' && !(requestBody instanceof Blob)) {
    requestBody = JSON.stringify(requestBody);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: requestBody
  });

  if (!response.ok) {
    if (response.status === 401) {
      if (path === '/auth/refresh' || path === '/auth/login' || path === '/auth/signup') {
        removeAuthToken();
        setCurrentUser(null);
        window.dispatchEvent(new Event('auth-logout'));
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errMsg);
      }

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        removeAuthToken();
        setCurrentUser(null);
        window.dispatchEvent(new Event('auth-logout'));
        throw new Error('Session expired. Please log in again.');
      }

      if (isRefreshing) {
        return new Promise<T>((resolve, reject) => {
          refreshQueue.push((newToken) => {
            if (newToken) {
              const retryHeaders = new Headers(options.headers || {});
              retryHeaders.set('Authorization', `Bearer ${newToken}`);
              resolve(request<T>(path, { ...options, headers: retryHeaders }));
            } else {
              reject(new Error('Session expired. Please log in again.'));
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!refreshResponse.ok) {
          const errBody = await refreshResponse.json().catch(() => ({}));
          throw new Error(errBody.data?.message || errBody.error || `Refresh failed with status ${refreshResponse.status}`);
        }

        const resData = await refreshResponse.json();
        // Unwrap data envelope if wrapped by ResponseWrapper middleware
        const refreshData = resData && typeof resData === 'object' && 'success' in resData ? resData.data : resData;
        const newToken = refreshData?.token;
        const newRefreshToken = refreshData?.refresh_token;

        if (!newToken || !newRefreshToken) {
          console.error('[Auth] Token refresh response is invalid:', resData);
          throw new Error('Invalid refresh response');
        }

        setAuthToken(newToken);
        setRefreshToken(newRefreshToken);

        isRefreshing = false;
        processQueue(newToken);

        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        
        if (!isFormData && !retryHeaders.has('Content-Type')) {
          retryHeaders.set('Content-Type', 'application/json');
        }

        return request<T>(path, { ...options, headers: retryHeaders });
      } catch (err) {
        console.error('[Auth] Token refresh failed:', err);
        isRefreshing = false;
        processQueue(null);
        removeAuthToken();
        setCurrentUser(null);
        window.dispatchEvent(new Event('auth-logout'));
        throw new Error('Session expired. Please log in again.');
      }
    }

    const errorData = await response.json().catch(() => ({}));
    const errMsg = errorData.data?.message || errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
    throw new Error(errMsg);
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  const resData = await response.json();
  if (resData && typeof resData === 'object' && 'success' in resData) {
    if (!resData.success) {
      throw new Error(resData.data?.message || 'API request failed');
    }
    return resData.data as T;
  }
  return resData as T;
}
