/**
 * LoginScreen - User authentication screen
 * Features: Gradient background, social login, ID/Phone login options
 */
import React, { useState } from "react";
import { View, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";
import { Text, Modal } from "@/components/ui";
import { SocialButton, AltLoginButton, CurvedDivider, OrDivider } from "@/components/auth";
import { DecoCircle } from "@/components/decorative";
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from "@/constants";
import { colors, withOpacity } from "@/themes";
import { useAuth, useToast } from "@/contexts";
import { GOOGLE_CLIENT_ID, FACEBOOK_APP_ID } from "@/config/env";
import type { RootStackParamList } from "../../App";

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, "Login">;

/**
 * LoginScreen component
 */
export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { loginWithGoogle, loginWithFacebook, isLoading, isAuthenticated } = useAuth();
  const toast = useToast();

  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Google OAuth setup
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
  });

  // Facebook OAuth setup
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
  });

  // Handle Google OAuth response
  React.useEffect(() => {
    if (googleResponse?.type === "success") {
      const { authentication } = googleResponse;
      if (authentication?.idToken) {
        handleGoogleAuth(authentication.idToken);
      }
    }
  }, [googleResponse]);

  // Handle Facebook OAuth response
  React.useEffect(() => {
    if (fbResponse?.type === "success") {
      const { authentication } = fbResponse;
      if (authentication?.accessToken) {
        handleFacebookAuth(authentication.accessToken);
      }
    }
  }, [fbResponse]);

  /**
   * Check if an error is a network error
   */
  const isNetworkError = (error: any): boolean => {
    if (error instanceof TypeError) return true;
    if (error.name === 'TypeError' || error.name === 'AbortError') return true;

    const message = (error.message || '').toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('unreachable')
    );
  };

  const getErrorMessage = (error: any, fallback: string): string => {
    if (isNetworkError(error)) {
      return 'Network error. Please check your connection and try again.';
    }
    return error.message || fallback;
  };

  const handleGoogleAuth = async (token: string) => {
    setAuthLoading(true);
    try {
      await loginWithGoogle({ token });
      // Navigation happens automatically via AuthStack -> MainStack swap
      // when isAuthenticated changes in AuthContext
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to login with Google"));
      setAuthLoading(false);
    }
  };

  const handleFacebookAuth = async (token: string) => {
    setAuthLoading(true);
    try {
      await loginWithFacebook({ token });
      // Navigation happens automatically via AuthStack -> MainStack swap
      // when isAuthenticated changes in AuthContext
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to login with Facebook"));
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!googleRequest) {
      toast.error("Google Sign In is not configured properly");
      return;
    }
    await googlePromptAsync();
  };

  const handleFacebookSignIn = async () => {
    if (!fbRequest) {
      toast.error("Facebook Sign In is not configured properly");
      return;
    }
    await fbPromptAsync();
  };

  const handleIdLogin = () => {
    navigation.navigate("CredentialLogin", { type: "id" });
  };

  const handlePhoneLogin = () => {
    navigation.navigate("CredentialLogin", { type: "phone" });
  };

  const handleEmailLogin = () => {
    navigation.navigate("CredentialLogin", { type: "email" });
  };

  const showLoading = isLoading || authLoading;

  return (
    <View className="flex-1 bg-white">
      {/* Orange Header Section */}
      <View
        className="relative overflow-hidden"
        style={{ backgroundColor: colors.primary[500], height: 320 }}
      >
        {/* Decorative Background Circles */}
        <DecoCircle size={120} position={{ top: -30, left: -40 }} opacity={0.08} />
        <DecoCircle size={80} position={{ top: 60, right: -20 }} opacity={0.1} />
        <DecoCircle size={60} position={{ bottom: 40, left: 20 }} opacity={0.06} />
        <DecoCircle size={100} position={{ bottom: 0, right: 30 }} opacity={0.08} />

        {/* Top spacing for safe area */}
        <View style={{ height: insets.top }} />

        {/* Logo Section */}
        <View className="items-center pt-6 pb-8 px-6">
          {/* Welcome Image */}
          <Image
            source={require("../../assets/login/logo.png")}
            style={{ width: 280, height: 180, marginBottom: 15 }}
            resizeMode="contain"
          />

          {/* Title */}
          <Text
            style={{
              fontSize: 48,
              fontWeight: "bold",
              fontFamily: "sans-serif-condensed",
              color: colors.white,
              letterSpacing: 4,
              textShadowColor: "rgba(0, 0, 0, 0.3)",
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 2,
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            FAHMAN
          </Text>

          <Text
            style={{
              fontSize: 10,
              fontWeight: "600",
              color: withOpacity(colors.white, 0.8),
              letterSpacing: 1,
              marginTop: 2,
            }}
          >
            PARTY GAME | Find your seat and have fun
          </Text>
        </View>
      </View>

      {/* Curved Divider */}
      <CurvedDivider />

      {/* White Content Section */}
      <View className="flex-1 px-6 -mt-2">
        {/* Welcome Text */}
        <View className="items-center mb-6">
          <Text variant="h3" className="font-bold mb-1">
            Welcome
          </Text>
          <Text variant="body" color="secondary">
            Sign in to start playing with friends
          </Text>
        </View>

        {/* Social Login Buttons */}
        <View className="gap-3">
          <SocialButton
            icon="logo-google"
            label="Continue with Google"
            onPress={handleGoogleSignIn}
            iconColor={colors.brands.google}
            disabled={showLoading}
          />
          <SocialButton
            icon="logo-facebook"
            label="Continue with Facebook"
            onPress={handleFacebookSignIn}
            iconColor={colors.brands.facebook}
            disabled={showLoading}
          />
        </View>

        {/* Or Divider */}
        <OrDivider />

        {/* Alternative Login Buttons */}
        <View className="flex-row justify-center gap-5">
          <AltLoginButton type="id" onPress={handleIdLogin} />
          <AltLoginButton type="phone" onPress={handlePhoneLogin} />
          <AltLoginButton type="email" onPress={handleEmailLogin} />
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Legal Text */}
        <View className="pb-4" style={{ paddingBottom: insets.bottom + 16 }}>
          <Text variant="caption" color="muted" center className="px-2 leading-5">
            By continuing you agree to our{" "}
            <Text
              variant="caption"
              className="font-semibold"
              style={{ color: colors.primary[500] }}
              onPress={() => setTermsModalVisible(true)}
            >
              Terms of Service
            </Text>
            {" and "}
            <Text
              variant="caption"
              className="font-semibold"
              style={{ color: colors.primary[500] }}
              onPress={() => setPrivacyModalVisible(true)}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>

      {/* Terms of Service Modal */}
      <Modal
        visible={termsModalVisible}
        onClose={() => setTermsModalVisible(false)}
        title="Terms of Service"
        maxHeight="85%"
      >
        <Text variant="body-sm" color="secondary" className="leading-6">
          {TERMS_OF_SERVICE}
        </Text>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
        title="Privacy Policy"
        maxHeight="85%"
      >
        <Text variant="body-sm" color="secondary" className="leading-6">
          {PRIVACY_POLICY}
        </Text>
      </Modal>
    </View>
  );
}
