/**
 * Login button components for authentication screen
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text, Icon, type IconName } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

/**
 * Social login button - with icon and label
 */
export interface SocialButtonProps {
  /** Icon name */
  icon: IconName;
  /** Button label */
  label: string;
  /** Press handler */
  onPress: () => void;
  /** Icon color */
  iconColor?: string;
  /** Background color */
  bgColor?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function SocialButton({
  icon,
  label,
  onPress,
  iconColor,
  bgColor = "white",
  disabled = false,
}: SocialButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center py-4 px-5 rounded-2xl active:opacity-90"
      style={{
        backgroundColor: bgColor === "white" ? colors.white : bgColor,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: withOpacity(iconColor || colors.text.primary, 0.1) }}
      >
        <Icon name={icon} size="md" color={iconColor || colors.text.primary} />
      </View>
      <Text variant="body" className="font-semibold flex-1">
        {label}
      </Text>
      <Icon name="chevron-forward" size="sm" color={colors.neutral[400]} />
    </Pressable>
  );
}

/**
 * Alternative login button - minimal icon button (ID/Phone/Email)
 */
export interface AltLoginButtonProps {
  /** Login type */
  type: "id" | "phone" | "email";
  /** Press handler */
  onPress: () => void;
}

/**
 * Renders the appropriate icon for each login type
 */
function AltLoginIcon({ type }: { type: AltLoginButtonProps["type"] }) {
  switch (type) {
    case "id":
      return (
        <Text
          variant="h3"
          className="font-black"
          style={{ color: colors.primary[500], letterSpacing: -1 }}
        >
          ID
        </Text>
      );
    case "phone":
      return <Icon name="call" size="lg" color={colors.primary[500]} />;
    case "email":
      return <Icon name="mail" size="lg" color={colors.primary[500]} />;
  }
}

export function AltLoginButton({ type, onPress }: AltLoginButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="w-14 h-14 rounded-full items-center justify-center active:scale-95"
      style={{
        borderWidth: 1.5,
        borderColor: withOpacity(colors.primary[500], 0.15),
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 0,
      }}
    >
      <AltLoginIcon type={type} />
    </Pressable>
  );
}
