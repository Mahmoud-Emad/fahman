/**
 * AuthContext - Authentication state management
 * Handles auth initialization, socket-based connectivity monitoring, and session management
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
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
import { api, setOnUnauthorized } from '@/services/api';
import { storage } from '@/services/storage';
import { socketService } from '@/services/socketService';
import { userService } from '@/services/userService';

// ============================================================================
// TYPES
// ============================================================================

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  connectionError: string | null;
  isInitializing: boolean;
  isNewUser: boolean;
}

interface AuthContextType extends AuthState {
  loginWithEmail: (data: LoginData) => Promise<void>;
  loginWithGameId: (data: LoginWithGameIdData) => Promise<void>;
  loginWithPhone: (data: LoginWithPhoneData) => Promise<void>;
  loginWithGoogle: (data: OAuthData) => Promise<void>;
  loginWithFacebook: (data: OAuthData) => Promise<void>;
  registerWithEmail: (data: RegisterData) => Promise<void>;
  sendPhoneVerification: (phoneNumber: string) => Promise<{ code?: string }>;
  verifyPhone: (phoneNumber: string, code: string) => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<{ code?: string }>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  updatePhoneNumber: (data: UpdatePhoneData) => Promise<{ code?: string }>;
  verifyUserPhone: (data: VerifyUserPhoneData) => Promise<void>;
  removePhoneNumber: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Re-run full auth initialization (health check + token validation) */
  reinitialize: () => Promise<void>;
  clearNewUserFlag: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    connectionError: null,
    isInitializing: true,
    isNewUser: false,
  });

  const wasDisconnected = useRef(false);

  // --------------------------------------------------------------------------
  // AUTH INITIALIZATION
  // --------------------------------------------------------------------------

  const initializeAuth = async () => {
    try {
      const { connected } = await api.checkHealth();
      if (!connected) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          connectionError: 'Unable to connect to server',
          isInitializing: false,
          isNewUser: false,
        });
        return;
      }

      const token = await storage.getAccessToken();
      if (token) {
        // The api interceptor handles 401 → refresh automatically.
        // If the access token is expired, the interceptor refreshes it
        // before returning. If refresh also fails, onUnauthorized fires.
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
            socketService.connect().catch(() => {});
            userService.updateStreak().catch(() => {});
            return;
          }
        } catch {
          // getCurrentUser failed even after refresh attempt — not authenticated
        }
      }
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        connectionError: 'Unable to connect to server',
        isInitializing: false,
        isNewUser: false,
      });
      return;
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

  // Run on mount
  useEffect(() => {
    // Register the unauthorized callback so the api interceptor can trigger logout
    setOnUnauthorized(() => {
      socketService.disconnect();
      setState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isNewUser: false,
      }));
    });

    initializeAuth();

    return () => { setOnUnauthorized(null); };
  }, []);

  // --------------------------------------------------------------------------
  // SOCKET-BASED CONNECTIVITY MONITORING
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (state.isInitializing) return;

    // Listen for socket connect/disconnect instead of polling HTTP health
    const unsubConnect = socketService.onConnect(() => {
      if (wasDisconnected.current) {
        wasDisconnected.current = false;
        setState(prev => ({ ...prev, isInitializing: true, connectionError: null }));
        initializeAuth();
      } else {
        setState(prev => {
          if (!prev.connectionError) return prev;
          return { ...prev, connectionError: null };
        });
      }
    });

    const unsubDisconnect = socketService.onDisconnect(() => {
      wasDisconnected.current = true;
      setState(prev => {
        if (prev.connectionError) return prev;
        return { ...prev, connectionError: 'Unable to connect to server' };
      });
    });

    // When app returns to foreground, socket.io reconnects automatically.
    // We just ensure the socket is connected.
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && !socketService.isConnected) {
        socketService.connect().catch(() => {});
      }
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initializeAuth is stable (no deps), re-subscribing on every render is wasteful
  }, [state.isInitializing]);

  // --------------------------------------------------------------------------
  // AUTH HELPERS
  // --------------------------------------------------------------------------

  const handleAuthResponse = useCallback((response: { data?: AuthResponse }) => {
    if (response.data) {
      const { user, isNewUser } = response.data;
      setState(prev => ({
        ...prev,
        user,
        isLoading: false,
        isAuthenticated: true,
        isNewUser: isNewUser ?? false,
      }));
      socketService.connect().catch(() => {});
    }
  }, []);

  // --------------------------------------------------------------------------
  // LOGIN METHODS
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // PHONE VERIFICATION
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // SESSION MANAGEMENT
  // --------------------------------------------------------------------------

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    // Retrieve refresh token before clearing storage so the server can revoke it
    const refreshToken = await storage.getRefreshToken();
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore logout API errors — clear local state regardless
    }
    await storage.clearAll();
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
        const user = response.data;
        setState(prev => ({ ...prev, user }));
      }
    } catch {
      // Non-critical — stale user data remains
    }
  }, []);

  const reinitialize = useCallback(async () => {
    setState(prev => ({ ...prev, isInitializing: true, connectionError: null }));
    await initializeAuth();
  }, []);

  // --------------------------------------------------------------------------
  // PASSWORD RESET
  // --------------------------------------------------------------------------

  const forgotPassword = useCallback(async (data: ForgotPasswordData) => {
    const response = await authService.forgotPassword(data);
    return { code: response.data?.code };
  }, []);

  const resetPassword = useCallback(async (data: ResetPasswordData) => {
    await authService.resetPassword(data);
  }, []);

  // --------------------------------------------------------------------------
  // PROFILE MANAGEMENT
  // --------------------------------------------------------------------------

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    const response = await authService.updateProfile(data);
    if (response.data) {
      const user = response.data;
      setState(prev => ({ ...prev, user }));
    }
  }, []);

  const updatePhoneNumber = useCallback(async (data: UpdatePhoneData) => {
    const response = await authService.updatePhoneNumber(data);
    if (response.data?.user) {
      const { user } = response.data;
      setState(prev => ({ ...prev, user }));
    }
    return { code: response.data?.code };
  }, []);

  const verifyUserPhone = useCallback(async (data: VerifyUserPhoneData) => {
    const response = await authService.verifyUserPhone(data);
    if (response.data) {
      const user = response.data;
      setState(prev => ({ ...prev, user }));
    }
  }, []);

  const removePhoneNumber = useCallback(async () => {
    const response = await authService.removePhoneNumber();
    if (response.data) {
      const user = response.data;
      setState(prev => ({ ...prev, user }));
    }
  }, []);

  const clearNewUserFlag = useCallback(() => {
    setState(prev => ({ ...prev, isNewUser: false }));
  }, []);

  // --------------------------------------------------------------------------
  // CONTEXT VALUE
  // --------------------------------------------------------------------------

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
      removePhoneNumber,
      logout,
      refreshUser,
      reinitialize,
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
      removePhoneNumber,
      logout,
      refreshUser,
      reinitialize,
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
