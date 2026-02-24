/**
 * CredentialLoginForm - Form fields for login/register by ID, Phone, or Email
 */
import React from "react";
import { View, Pressable, ActivityIndicator } from "react-native";
import { Text, Button, Icon, Input, type IconName } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

export type LoginType = "id" | "phone" | "email";
export type AuthMode = "login" | "register";

export interface FormErrors {
  identifier?: string;
  password?: string;
  fullName?: string;
}

export interface LoginConfig {
  title: string;
  registerTitle: string;
  icon: IconName | "ID";
  inputLabel: string;
  inputPlaceholder: string;
  inputIcon: IconName | "ID";
  keyboardType: "default" | "email-address" | "number-pad";
  supportsRegister: boolean;
}

interface CredentialLoginFormProps {
  loginType: LoginType;
  config: LoginConfig;
  isRegisterMode: boolean;
  identifier: string;
  password: string;
  fullName: string;
  showPassword: boolean;
  errors: FormErrors;
  showLoading: boolean;
  onIdentifierChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onFullNameChange: (text: string) => void;
  onTogglePassword: () => void;
  onForgotPassword: () => void;
  onToggleAuthMode: () => void;
  onSubmit: () => void;
}

/**
 * Form content for credential-based login and registration
 */
export function CredentialLoginForm({
  config,
  isRegisterMode,
  identifier,
  password,
  fullName,
  showPassword,
  errors,
  showLoading,
  onIdentifierChange,
  onPasswordChange,
  onFullNameChange,
  onTogglePassword,
  onForgotPassword,
  onToggleAuthMode,
  onSubmit,
}: CredentialLoginFormProps) {
  const renderIcon = () => {
    if (config.icon === "ID") {
      return (
        <Text
          variant="h1"
          className="font-black"
          style={{ color: colors.primary[500], letterSpacing: -2 }}
        >
          ID
        </Text>
      );
    }
    return <Icon name={config.icon} size="xl" color={colors.primary[500]} />;
  };

  const renderInputIcon = () => {
    if (config.inputIcon === "ID") {
      return (
        <Text
          variant="caption"
          className="font-bold"
          style={{ color: colors.neutral[400] }}
        >
          ID
        </Text>
      );
    }
    return <Icon name={config.inputIcon} size="sm" color={colors.neutral[400]} />;
  };

  return (
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
          {renderIcon()}
        </View>
      </View>

      {/* Form Fields */}
      <View className="gap-4">
        {isRegisterMode && (
          <View>
            <Text variant="label" className="mb-2 font-medium">
              Full Name
            </Text>
            <Input
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={onFullNameChange}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!showLoading}
              leftIcon={<Icon name="person-outline" size="sm" color={colors.neutral[400]} />}
              error={errors.fullName}
            />
          </View>
        )}

        <View>
          <Text variant="label" className="mb-2 font-medium">
            {config.inputLabel}
          </Text>
          <Input
            placeholder={config.inputPlaceholder}
            value={identifier}
            onChangeText={onIdentifierChange}
            keyboardType={config.keyboardType}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!showLoading}
            leftIcon={renderInputIcon()}
            error={errors.identifier}
          />
        </View>

        <View>
          <Text variant="label" className="mb-2 font-medium">
            Password
          </Text>
          <Input
            placeholder={isRegisterMode ? "Create a password" : "Enter your password"}
            value={password}
            onChangeText={onPasswordChange}
            secureTextEntry={!showPassword}
            editable={!showLoading}
            leftIcon={<Icon name="lock-closed-outline" size="sm" color={colors.neutral[400]} />}
            rightIcon={
              <Pressable onPress={onTogglePassword}>
                <Icon
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size="sm"
                  color={colors.neutral[400]}
                />
              </Pressable>
            }
            error={errors.password}
          />
          {isRegisterMode && (
            <Text variant="caption" color="muted" className="mt-1">
              Must contain uppercase, lowercase, and number
            </Text>
          )}
        </View>
      </View>

      {/* Submit Button */}
      <View className="mt-8">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          borderRadius="rounded-xl"
          onPress={onSubmit}
          disabled={showLoading}
        >
          {showLoading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={{ color: colors.white }} className="font-semibold">
                {isRegisterMode ? "Creating account..." : "Signing in..."}
              </Text>
            </View>
          ) : isRegisterMode ? (
            "Create Account"
          ) : (
            "Sign In"
          )}
        </Button>
      </View>

      {/* Forgot Password */}
      {!isRegisterMode && (
        <Pressable
          onPress={onForgotPassword}
          className="mt-4 py-2"
          disabled={showLoading}
        >
          <Text
            variant="body"
            center
            className="font-medium"
            style={{ color: showLoading ? colors.neutral[400] : colors.primary[500] }}
          >
            Forgot Password?
          </Text>
        </Pressable>
      )}

      {/* Toggle Auth Mode */}
      {config.supportsRegister && (
        <View className="mt-6 flex-row justify-center items-center">
          <Text variant="body" color="secondary">
            {isRegisterMode ? "Already have an account? " : "Don't have an account? "}
          </Text>
          <Pressable onPress={onToggleAuthMode} disabled={showLoading}>
            <Text
              variant="body"
              className="font-semibold"
              style={{ color: showLoading ? colors.neutral[400] : colors.primary[500] }}
            >
              {isRegisterMode ? "Sign In" : "Sign Up"}
            </Text>
          </Pressable>
        </View>
      )}

      <View className="flex-1 min-h-4" />
    </View>
  );
}
