/**
 * AuthContext - Authentication state management
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import {
  authService,
  User,
  AuthResponse,
  LoginWithGameIdData,
  LoginWithPhoneData,
  LoginData,
  RegisterData,
  OAuthData,
  ForgotPasswordData,
  ResetPasswordData,
  UpdateProfileData,
  UpdatePhoneData,
  VerifyUserPhoneData,
} from '@/services/authService';
import { api } from '@/services/api';
import { storage } from '@/services/storage';
import { socketService } from '@/services/socketService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  connectionError: string | null;
  isInitializing: boolean; // True only during initial auth check on app start
  isNewUser: boolean; // True when user just registered and needs to select avatar
}

interface AuthContextType extends AuthState {
  // Login methods
  loginWithEmail: (data: LoginData) => Promise<void>;
  loginWithGameId: (data: LoginWithGameIdData) => Promise<void>;
  loginWithPhone: (data: LoginWithPhoneData) => Promise<void>;
  loginWithGoogle: (data: OAuthData) => Promise<void>;
  loginWithFacebook: (data: OAuthData) => Promise<void>;

  // Registration
  registerWithEmail: (data: RegisterData) => Promise<void>;

  // Phone verification
  sendPhoneVerification: (phoneNumber: string) => Promise<{ code?: string }>;
  verifyPhone: (phoneNumber: string, code: string) => Promise<void>;

  // Password reset
  forgotPassword: (data: ForgotPasswordData) => Promise<{ code?: string }>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;

  // Profile management
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  updatePhoneNumber: (data: UpdatePhoneData) => Promise<{ code?: string }>;
  verifyUserPhone: (data: VerifyUserPhoneData) => Promise<void>;

  // Session management
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // Connection
  checkConnection: () => Promise<boolean>;
  clearConnectionError: () => void;

  // New user avatar selection
  clearNewUserFlag: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    connectionError: null,
    isInitializing: true, // Only true during initial auth check
    isNewUser: false,
  });

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // First check if backend is reachable
      const { connected, error: connectionError } = await api.checkHealth();
      if (!connected) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          connectionError: connectionError || 'Unable to connect to server',
          isInitializing: false,
          isNewUser: false,
        });
        return;
      }

      const token = await storage.getAccessToken();
      if (token) {
        // Try to get fresh user data
        try {
          const response = await authService.getCurrentUser();
          if (response.data) {
            setState({
              user: response.data,
              isLoading: false,
              isAuthenticated: true,
              connectionError: null,
              isInitializing: false,
              isNewUser: false,
            });
            return;
          }
        } catch (error) {
          // Token might be expired, try to refresh
          try {
            await authService.refreshToken();
            const response = await authService.getCurrentUser();
            if (response.data) {
              setState({
                user: response.data,
                isLoading: false,
                isAuthenticated: true,
                connectionError: null,
                isInitializing: false,
                isNewUser: false,
              });
              return;
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens
            await storage.clearAll();
          }
        }
      }
    } catch {
      // Initialization failure — app will show login screen via unauthenticated state
    }

    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      connectionError: null,
      isInitializing: false,
      isNewUser: false,
    });
  };

  const handleAuthResponse = useCallback((response: { data?: AuthResponse }) => {
    if (response.data) {
      setState(prev => ({
        ...prev,
        user: response.data!.user,
        isLoading: false,
        isAuthenticated: true,
        isNewUser: response.data!.isNewUser ?? false,
      }));

      // Connect to WebSocket after successful authentication
      socketService.connect().catch(() => {
        // WebSocket connection failure is non-critical; real-time features will be unavailable
      });
    }
  }, []);

  const loginWithEmail = useCallback(async (data: LoginData) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await authService.loginWithEmail(data);
      handleAuthResponse(response);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [handleAuthResponse]);

  const registerWithEmail = useCallback(async (data: RegisterData) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await authService.register(data);
      handleAuthResponse(response);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [handleAuthResponse]);

  const loginWithGameId = useCallback(async (data: LoginWithGameIdData) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await authService.loginWithGameId(data);
      handleAuthResponse(response);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [handleAuthResponse]);

  const loginWithPhone = useCallback(async (data: LoginWithPhoneData) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await authService.loginWithPhone(data);
      handleAuthResponse(response);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [handleAuthResponse]);

  const loginWithGoogle = useCallback(async (data: OAuthData) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await authService.loginWithGoogle(data);
      handleAuthResponse(response);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [handleAuthResponse]);

  const loginWithFacebook = useCallback(async (data: OAuthData) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await authService.loginWithFacebook(data);
      handleAuthResponse(response);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [handleAuthResponse]);

  const sendPhoneVerification = useCallback(async (phoneNumber: string) => {
    const response = await authService.sendPhoneVerification(phoneNumber);
    return { code: response.data?.code };
  }, []);

  const verifyPhone = useCallback(async (phoneNumber: string, code: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await authService.verifyPhone({ phoneNumber, code });
      handleAuthResponse(response);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [handleAuthResponse]);

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    await authService.logout();

    // Disconnect from WebSocket
    socketService.disconnect();

    setState(prev => ({
      ...prev,
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isNewUser: false,
    }));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.data) {
        setState(prev => ({
          ...prev,
          user: response.data!,
        }));
      }
    } catch {
      // Refresh failure is non-critical; stale user data will remain in state
    }
  }, []);

  const checkConnection = useCallback(async () => {
    const { connected, error: connectionError } = await api.checkHealth();
    setState(prev => ({
      ...prev,
      connectionError: connected ? null : (connectionError || 'Unable to connect to server'),
    }));
    return connected;
  }, []);

  const clearConnectionError = useCallback(() => {
    setState(prev => ({
      ...prev,
      connectionError: null,
    }));
  }, []);

  const clearNewUserFlag = useCallback(() => {
    setState(prev => ({
      ...prev,
      isNewUser: false,
    }));
  }, []);

  const forgotPassword = useCallback(async (data: ForgotPasswordData) => {
    const response = await authService.forgotPassword(data);
    return { code: response.data?.code };
  }, []);

  const resetPassword = useCallback(async (data: ResetPasswordData) => {
    await authService.resetPassword(data);
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    const response = await authService.updateProfile(data);
    if (response.data) {
      setState(prev => ({
        ...prev,
        user: response.data!,
      }));
    }
  }, []);

  const updatePhoneNumber = useCallback(async (data: UpdatePhoneData) => {
    const response = await authService.updatePhoneNumber(data);
    if (response.data?.user) {
      setState(prev => ({
        ...prev,
        user: response.data!.user,
      }));
    }
    return { code: response.data?.code };
  }, []);

  const verifyUserPhone = useCallback(async (data: VerifyUserPhoneData) => {
    const response = await authService.verifyUserPhone(data);
    if (response.data) {
      setState(prev => ({
        ...prev,
        user: response.data!,
      }));
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      ...state,
      loginWithEmail,
      loginWithGameId,
      loginWithPhone,
      loginWithGoogle,
      loginWithFacebook,
      registerWithEmail,
      sendPhoneVerification,
      verifyPhone,
      forgotPassword,
      resetPassword,
      updateProfile,
      updatePhoneNumber,
      verifyUserPhone,
      logout,
      refreshUser,
      checkConnection,
      clearConnectionError,
      clearNewUserFlag,
    }),
    [
      state,
      loginWithEmail,
      loginWithGameId,
      loginWithPhone,
      loginWithGoogle,
      loginWithFacebook,
      registerWithEmail,
      sendPhoneVerification,
      verifyPhone,
      forgotPassword,
      resetPassword,
      updateProfile,
      updatePhoneNumber,
      verifyUserPhone,
      logout,
      refreshUser,
      checkConnection,
      clearConnectionError,
      clearNewUserFlag,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
