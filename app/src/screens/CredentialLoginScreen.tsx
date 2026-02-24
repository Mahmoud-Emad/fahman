/**
 * CredentialLoginScreen - Login/Register with ID, Phone, or Email
 * Renders different input fields based on login type
 */
import React, { useState, useEffect, useMemo } from "react";
import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { Text, Icon } from "@/components/ui";
import { colors } from "@/themes";
import { useAuth } from "@/contexts";
import { CredentialLoginForm, type LoginType, type AuthMode, type FormErrors, type LoginConfig } from "@/components/auth/CredentialLoginForm";
import type { RootStackParamList } from "../../App";

type CredentialLoginRouteProp = RouteProp<RootStackParamList, "CredentialLogin">;
type CredentialLoginNavigationProp = StackNavigationProp<RootStackParamList, "CredentialLogin">;

const LOGIN_CONFIG: Record<LoginType, LoginConfig> = {
  id: {
    title: "Sign in with ID",
    registerTitle: "Sign in with ID",
    icon: "ID",
    inputLabel: "Game ID",
    inputPlaceholder: "Enter your Game ID (e.g., 100001)",
    inputIcon: "ID",
    keyboardType: "number-pad",
    supportsRegister: false,
  },
  phone: {
    title: "Sign in with Phone",
    registerTitle: "Sign in with Phone",
    icon: "call",
    inputLabel: "Phone Number",
    inputPlaceholder: "Enter your phone number",
    inputIcon: "call-outline",
    keyboardType: "number-pad",
    supportsRegister: false,
  },
  email: {
    title: "Sign in with Email",
    registerTitle: "Create Account",
    icon: "mail",
    inputLabel: "Email Address",
    inputPlaceholder: "Enter your email address",
    inputIcon: "mail-outline",
    keyboardType: "email-address",
    supportsRegister: true,
  },
};

/**
 * CredentialLoginScreen component
 */
export function CredentialLoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CredentialLoginNavigationProp>();
  const route = useRoute<CredentialLoginRouteProp>();
  const {
    loginWithEmail,
    loginWithGameId,
    loginWithPhone,
    registerWithEmail,
    isLoading,
  } = useAuth();

  const loginType = (route.params?.type || "id") as LoginType;
  const config = LOGIN_CONFIG[loginType];

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const isRegisterMode = authMode === "register" && config.supportsRegister;
  const showLoading = isLoading || submitting;

  useEffect(() => {
    setErrors({});
  }, [authMode]);

  const screenTitle = useMemo(
    () => (isRegisterMode ? config.registerTitle : config.title),
    [isRegisterMode, config]
  );

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (isRegisterMode) {
      if (!fullName.trim()) {
        newErrors.fullName = "Full name is required";
      } else if (fullName.trim().length < 2) {
        newErrors.fullName = "Full name must be at least 2 characters";
      }
    }

    switch (loginType) {
      case "id":
        if (!identifier) {
          newErrors.identifier = "Game ID is required";
        } else if (!/^\d+$/.test(identifier)) {
          newErrors.identifier = "Game ID must contain only numbers";
        } else if (identifier.length < 5) {
          newErrors.identifier = "Game ID must be at least 5 digits";
        }
        break;
      case "phone":
        if (!identifier) {
          newErrors.identifier = "Phone number is required";
        } else if (!/^\d+$/.test(identifier)) {
          newErrors.identifier = "Phone number must contain only numbers";
        } else if (identifier.length < 10) {
          newErrors.identifier = "Please enter a valid phone number";
        }
        break;
      case "email":
        if (!identifier.trim()) {
          newErrors.identifier = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
          newErrors.identifier = "Please enter a valid email address";
        }
        break;
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (isRegisterMode && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isNetworkError = (error: any): boolean => {
    if (error instanceof TypeError) return true;
    if (error.name === "TypeError" || error.name === "AbortError") return true;
    const message = (error.message || "").toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("unreachable") ||
      message.includes("unable to connect")
    );
  };

  const handleError = (error: any) => {
    if (isNetworkError(error)) {
      setErrors({ identifier: "Network error. Please try again." });
      return;
    }
    const message = error.message || error.error || "An error occurred. Please try again.";
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("name")) {
      setErrors({ fullName: message });
    } else if (
      lowerMessage.includes("email") ||
      lowerMessage.includes("phone") ||
      lowerMessage.includes("id") ||
      lowerMessage.includes("user")
    ) {
      setErrors({ identifier: message });
    } else if (lowerMessage.includes("password") || lowerMessage.includes("credential")) {
      setErrors({ password: message });
    } else {
      setErrors({ identifier: message });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setErrors({});

    try {
      if (isRegisterMode) {
        await registerWithEmail({
          displayName: fullName.trim(),
          email: identifier.trim(),
          password,
        });
      } else {
        switch (loginType) {
          case "id":
            await loginWithGameId({ gameId: parseInt(identifier, 10), password });
            break;
          case "phone":
            const phoneNumber = identifier.startsWith("+") ? identifier : `+20${identifier}`;
            await loginWithPhone({ phoneNumber, password });
            break;
          case "email":
            await loginWithEmail({ email: identifier.trim(), password });
            break;
        }
      }
    } catch (error: any) {
      handleError(error);
      setSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    if (loginType === "email") {
      navigation.navigate("ForgotPassword");
    } else {
      Alert.alert(
        "Forgot Password",
        "To reset your password, please use the email login method and tap 'Forgot Password'.",
        [{ text: "OK" }]
      );
    }
  };

  const handleIdentifierChange = (text: string) => {
    if (loginType === "id" || loginType === "phone") {
      const numericText = text.replace(/[^0-9]/g, "");
      if (loginType === "id" && numericText.length <= 15) {
        setIdentifier(numericText);
      } else if (loginType === "phone") {
        setIdentifier(numericText);
      }
    } else {
      setIdentifier(text);
    }
    clearError("identifier");
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View style={{ paddingTop: insets.top, backgroundColor: colors.primary[500] }}>
        <View className="flex-row items-center px-4 py-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full items-center justify-center -ml-2 active:bg-white/10"
            disabled={showLoading}
          >
            <Icon name="chevron-back" color={colors.white} size="lg" />
          </Pressable>
          <Text
            variant="h3"
            className="flex-1 text-center mr-8 font-bold"
            style={{ color: colors.white }}
          >
            {screenTitle}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <CredentialLoginForm
            loginType={loginType}
            config={config}
            isRegisterMode={isRegisterMode}
            identifier={identifier}
            password={password}
            fullName={fullName}
            showPassword={showPassword}
            errors={errors}
            showLoading={showLoading}
            onIdentifierChange={handleIdentifierChange}
            onPasswordChange={(text) => { setPassword(text); clearError("password"); }}
            onFullNameChange={(text) => { setFullName(text); clearError("fullName"); }}
            onTogglePassword={() => setShowPassword((prev) => !prev)}
            onForgotPassword={handleForgotPassword}
            onToggleAuthMode={() => setAuthMode((prev) => (prev === "login" ? "register" : "login"))}
            onSubmit={handleSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
