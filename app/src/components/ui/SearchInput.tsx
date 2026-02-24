/**
 * SearchInput - Reusable search input component with icon and clear button
 */
import React from "react";
import { View, TextInput, type TextInputProps } from "react-native";
import { Icon } from "./Icon";
import { Pressable } from "./Pressable";
import { colors } from "@/themes";

export interface SearchInputProps extends Omit<TextInputProps, "style"> {
  /** Current search value */
  value: string;
  /** Callback when text changes */
  onChangeText: (text: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Callback when clear button is pressed */
  onClear?: () => void;
  /** Visual variant */
  variant?: "default" | "filled" | "outlined";
  /** Whether to auto focus on mount */
  autoFocus?: boolean;
  /** Custom container class names */
  className?: string;
}

/**
 * SearchInput component - Search field with icon and clear button
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 *   placeholder="Search friends..."
 * />
 * ```
 */
export function SearchInput({
  value,
  onChangeText,
  placeholder = "Search...",
  onClear,
  variant = "default",
  autoFocus = false,
  className = "",
  ...props
}: SearchInputProps) {
  const handleClear = () => {
    onChangeText("");
    onClear?.();
  };

  const getContainerStyle = () => {
    switch (variant) {
      case "filled":
        return {
          backgroundColor: colors.neutral[100],
          borderWidth: 0,
        };
      case "outlined":
        return {
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {
          backgroundColor: colors.neutral[100],
          borderWidth: 1,
          borderColor: colors.border,
        };
    }
  };

  return (
    <View
      className={`flex-row items-center rounded-xl px-3 py-2.5 ${className}`}
      style={getContainerStyle()}
    >
      <Icon name="search" size="sm" color={colors.neutral[400]} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral[400]}
        autoFocus={autoFocus}
        className="flex-1 ml-2"
        style={{
          color: colors.text.primary,
          fontSize: 15,
          padding: 0,
        }}
        {...props}
      />
      {value.length > 0 && (
        <Pressable onPress={handleClear} delayPressIn={0} hitSlop={8}>
          <Icon name="close-circle" size="sm" color={colors.neutral[400]} />
        </Pressable>
      )}
    </View>
  );
}
