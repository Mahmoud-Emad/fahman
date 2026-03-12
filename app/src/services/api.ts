/**
 * API service - Base HTTP client with automatic token refresh on 401
 */

import { API_URL, SOCKET_URL } from '@/config/env';
import { storage } from './storage';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: ApiFieldError[];
  fieldErrors?: Record<string, string>;
}

// Callback invoked when refresh fails — AuthContext registers its logout here
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: (() => void) | null): void {
  onUnauthorized = callback;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(includeAuth: boolean = true, tokenOverride?: string): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = tokenOverride || await storage.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private buildApiError(data: any, status: number): ApiError {
    let fieldErrors: Record<string, string> | undefined;
    if (Array.isArray(data.errors)) {
      fieldErrors = {};
      for (const err of data.errors) {
        if (err.field && err.message) {
          fieldErrors[err.field] = err.message;
        }
      }
    }

    return {
      message: data.message || 'An error occurred',
      status,
      errors: data.errors,
      fieldErrors,
    };
  }

  /**
   * Core request method with automatic 401 token refresh.
   * The refresh endpoint itself (includeAuth=false) bypasses the interceptor.
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: object,
    includeAuth: boolean = true,
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: await this.getHeaders(includeAuth),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && includeAuth) {
      // Don't intercept auth endpoints that intentionally send credentials
      const newToken = await this.handleTokenRefresh();
      if (newToken) {
        // Retry original request with fresh token
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          method,
          headers: await this.getHeaders(true, newToken),
          body: body ? JSON.stringify(body) : undefined,
        });
        return this.parseResponse<T>(retryResponse);
      }
      // Refresh failed — throw the original 401
    }

    return this.parseResponse<T>(response);
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    if (!response.ok) {
      throw this.buildApiError(data, response.status);
    }
    return data;
  }

  /**
   * Handle 401 by refreshing the access token.
   * Concurrent callers queue behind a single refresh attempt.
   */
  private handleTokenRefresh(): Promise<string | null> {
    if (this.isRefreshing) {
      // Another request is already refreshing — wait in line
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    return (async () => {
      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) {
          this.flushQueue(null, new Error('No refresh token'));
          onUnauthorized?.();
          return null;
        }

        // Call refresh endpoint directly (no auth, no interceptor)
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          this.flushQueue(null, new Error('Refresh failed'));
          await storage.clearAll();
          onUnauthorized?.();
          return null;
        }

        const data = await response.json();
        const tokens = data.data?.tokens;
        if (!tokens?.accessToken || !tokens?.refreshToken) {
          this.flushQueue(null, new Error('Invalid refresh response'));
          await storage.clearAll();
          onUnauthorized?.();
          return null;
        }

        await storage.setTokens(tokens.accessToken, tokens.refreshToken);

        // Resolve all queued requests with the new token
        this.flushQueue(tokens.accessToken, null);
        return tokens.accessToken;
      } catch (error) {
        this.flushQueue(null, error);
        await storage.clearAll();
        onUnauthorized?.();
        return null;
      } finally {
        this.isRefreshing = false;
      }
    })();
  }

  private flushQueue(token: string | null, error: unknown): void {
    const queue = [...this.refreshQueue];
    this.refreshQueue = [];
    for (const { resolve, reject } of queue) {
      if (token) {
        resolve(token);
      } else {
        reject(error);
      }
    }
  }

  // --- Public HTTP methods ---

  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, includeAuth);
  }

  async post<T>(endpoint: string, body?: object, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body, includeAuth);
  }

  async put<T>(endpoint: string, body?: object, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body, includeAuth);
  }

  async patch<T>(endpoint: string, body?: object, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, body, includeAuth);
  }

  async delete<T>(endpoint: string, body?: object, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, body, includeAuth);
  }

  /**
   * Check if the backend server is reachable
   */
  async checkHealth(timeoutMs: number = 5000): Promise<{ connected: boolean; version?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${SOCKET_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        return { connected: true, version: data.version };
      }
      return { connected: false };
    } catch {
      clearTimeout(timeoutId);
      return { connected: false };
    }
  }
}

export const api = new ApiClient(API_URL);
