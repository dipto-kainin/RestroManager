const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Auth helpers
export const setAuthToken = (token: string) => {
  localStorage.setItem('restro_token', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('restro_token');
};

export const removeAuthToken = () => {
  localStorage.removeItem('restro_token');
};

export interface User {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'staff' | 'user';
}

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
