/**
 * Environment configuration
 */
import { Platform } from 'react-native';

// Get the appropriate localhost URL based on platform
const getLocalUrl = () => {
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to reach host machine
    // For physical device, use your computer's IP: 192.168.1.60
    return '192.168.1.116:3000'; // Change to 10.0.2.2:3000 for emulator
  }
  // iOS simulator can use localhost
  return 'localhost:3000';
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
