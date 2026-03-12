/**
 * Environment configuration
 *
 * DEV_SERVER_IP is auto-configured by `make configure`.
 * Run it whenever your machine's IP changes.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Auto-configured by `make configure` — do not edit manually
const DEV_SERVER_IP = '192.168.1.34';

// Get the appropriate server host based on platform
const getLocalUrl = () => {
  if (Platform.OS === 'android') {
    return `${DEV_SERVER_IP}:3000`;
  }
  // iOS simulator can use localhost, physical iOS device needs the IP
  return Constants.isDevice ? `${DEV_SERVER_IP}:3000` : 'localhost:3000';
};

const LOCAL_URL = getLocalUrl();

// API Base URL - change this when deploying
export const API_URL = __DEV__
  ? `http://${LOCAL_URL}/api`  // Development
  : 'https://api.fahman.app/api'; // Production

// WebSocket URL - same server, no /api path
export const SOCKET_URL = __DEV__
  ? `http://${LOCAL_URL}`      // Development
  : 'https://api.fahman.app';    // Production

// OAuth Client IDs
export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
export const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '';

// App Scheme for OAuth redirects
export const APP_SCHEME = 'fahman';
