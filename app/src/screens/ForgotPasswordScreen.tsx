/**
 * ForgotPasswordScreen - Password reset flow
 * Step 1: Enter email to receive reset code
 * Step 2: Enter code and new password
 */
import React, { useState } from "react";
import { View, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { Text, Button, Icon, Input } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { getErrorMessage } from "@/utils/errorUtils";
import { useAuth } from "@/contexts";
import type { RootStackParamList } from "../../App";

type ForgotPasswordNavigationProp = StackNavigationProp<RootStackParamList, "ForgotPassword">;

type Step = "email" | "reset";

interface FormErrors {
  email?: string;
  code?: string;
  newPassword?: string;
  confirmPassword?: string;
}

/**
 * ForgotPasswordScreen component
 */
export function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const validateEmail = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateReset = (): boolean => {
    const newErrors: FormErrors = {};

    if (!code.trim()) {
      newErrors.code = "Reset code is required";
    } else if (!/^\d{6}$/.test(code)) {
      newErrors.code = "Code must be 6 digits";
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      newErrors.newPassword = "Password must contain uppercase, lowercase, and number";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendCode = async () => {
    if (!validateEmail()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const result = await forgotPassword({ email: email.trim() });

      // In development, show the code
      if (result.code) {
        Alert.alert("Development Mode", `Reset code: ${result.code}`);
      }

      setStep("reset");
    } catch (error) {
      setErrors({ email: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateReset()) return;

    setSubmitting(true);
    setErrors({});

    try {
      await resetPassword({
        email: email.trim(),
        code,
        newPassword,
      });

      Alert.alert(
        "Password Reset",
        "Your password has been reset successfully. You can now login with your new password.",
        [
          {
            text: "Login",
            onPress: () => navigation.navigate("CredentialLogin", { type: "email" }),
          },
        ]
      );
    } catch (error) {
      const message = getErrorMessage(error);
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes("code")) {
        setErrors({ code: message });
      } else if (lowerMessage.includes("password")) {
        setErrors({ newPassword: message });
      } else {
        setErrors({ code: message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const screenTitle = step === "email" ? "Forgot Password" : "Reset Password";

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: colors.primary[500],
        }}
      >
        <View className="flex-row items-center px-4 py-4">
          <Pressable
            onPress={() => {
              if (step === "reset") {
                setStep("email");
                setCode("");
                setNewPassword("");
                setConfirmPassword("");
                setErrors({});
              } else {
                navigation.goBack();
              }
            }}
            className="w-10 h-10 rounded-full items-center justify-center -ml-2 active:bg-white/10"
            disabled={submitting}
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
          <View className="flex-1 px-6 pt-8">
            {/* Icon */}
            <View className="items-center mb-8">
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{
                  borderWidth: 1.5,
                  borderColor: withOpacity(colors.primary[500], 0.15),
                  shadowColor: colors.primary[500],
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 0,
                }}
              >
                <Icon
                  name={step === "email" ? "mail-outline" : "lock-closed-outline"}
                  size="xl"
                  color={colors.primary[500]}
                />
              </View>
            </View>

            {/* Description */}
            <View className="items-center mb-6">
              <Text variant="body" color="secondary" center className="px-4">
                {step === "email"
                  ? "Enter your email address and we'll send you a code to reset your password."
                  : "Enter the 6-digit code sent to your email and create a new password."}
              </Text>
            </View>

            {/* Form */}
            <View className="gap-4">
              {step === "email" ? (
                /* Step 1: Email Input */
                <View>
                  <Text variant="label" className="mb-2 font-medium">
                    Email Address
                  </Text>
                  <Input
                    placeholder="Enter your email address"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      clearError("email");
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!submitting}
                    leftIcon={<Icon name="mail-outline" size="sm" color={colors.neutral[400]} />}
                    error={errors.email}
                  />
                </View>
              ) : (
                /* Step 2: Reset Code & New Password */
                <>
                  <View>
                    <Text variant="label" className="mb-2 font-medium">
                      Reset Code
                    </Text>
                    <Input
                      placeholder="Enter 6-digit code"
                      value={code}
                      onChangeText={(text) => {
                        const numericText = text.replace(/[^0-9]/g, "").slice(0, 6);
                        setCode(numericText);
                        clearError("code");
                      }}
                      keyboardType="number-pad"
                      editable={!submitting}
                      leftIcon={<Icon name="keypad-outline" size="sm" color={colors.neutral[400]} />}
                      error={errors.code}
                    />
                  </View>

                  <View>
                    <Text variant="label" className="mb-2 font-medium">
                      New Password
                    </Text>
                    <Input
                      placeholder="Create a new password"
                      value={newPassword}
                      onChangeText={(text) => {
                        setNewPassword(text);
                        clearError("newPassword");
                      }}
                      secureTextEntry={!showPassword}
                      editable={!submitting}
                      leftIcon={<Icon name="lock-closed-outline" size="sm" color={colors.neutral[400]} />}
                      rightIcon={
                        <Pressable onPress={() => setShowPassword(!showPassword)}>
                          <Icon
                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                            size="sm"
                            color={colors.neutral[400]}
                          />
                        </Pressable>
                      }
                      error={errors.newPassword}
                    />
                    <Text variant="caption" color="muted" className="mt-1">
                      Must contain uppercase, lowercase, and number
                    </Text>
                  </View>

                  <View>
                    <Text variant="label" className="mb-2 font-medium">
                      Confirm Password
                    </Text>
                    <Input
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        clearError("confirmPassword");
                      }}
                      secureTextEntry={!showPassword}
                      editable={!submitting}
                      leftIcon={<Icon name="lock-closed-outline" size="sm" color={colors.neutral[400]} />}
                      error={errors.confirmPassword}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Submit Button */}
            <View className="mt-8">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                borderRadius="rounded-xl"
                onPress={step === "email" ? handleSendCode : handleResetPassword}
                disabled={submitting}
              >
                {submitting ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator size="small" color={colors.white} />
                    <Text style={{ color: colors.white }} className="font-semibold">
                      {step === "email" ? "Sending..." : "Resetting..."}
                    </Text>
                  </View>
                ) : step === "email" ? (
                  "Send Reset Code"
                ) : (
                  "Reset Password"
                )}
              </Button>
            </View>

            {/* Resend Code Link (only in reset step) */}
            {step === "reset" && (
              <Pressable
                onPress={handleSendCode}
                className="mt-4 py-2"
                disabled={submitting}
              >
                <Text
                  variant="body"
                  center
                  className="font-medium"
                  style={{ color: submitting ? colors.neutral[400] : colors.primary[500] }}
                >
                  Resend Code
                </Text>
              </Pressable>
            )}

            {/* Back to Login Link */}
            <View className="mt-6 flex-row justify-center items-center">
              <Text variant="body" color="secondary">
                Remember your password?{" "}
              </Text>
              <Pressable
                onPress={() => navigation.navigate("CredentialLogin", { type: "email" })}
                disabled={submitting}
              >
                <Text
                  variant="body"
                  className="font-semibold"
                  style={{ color: submitting ? colors.neutral[400] : colors.primary[500] }}
                >
                  Sign In
                </Text>
              </Pressable>
            </View>

            {/* Spacer */}
            <View className="flex-1 min-h-4" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
