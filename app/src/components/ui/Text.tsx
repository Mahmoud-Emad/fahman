/**
 * Text component - Typography component for consistent text styling
 * Supports various sizes, weights, and colors from the theme
 */
import React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cn } from "@/utils/cn";

/**
 * Text variant options
 */
export type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body"
  | "body-sm"
  | "caption"
  | "label";

/**
 * Text color options
 */
export type TextColor =
  | "default"
  | "secondary"
  | "muted"
  | "inverse"
  | "primary"
  | "error"
  | "success"
  | "warning";

/**
 * Props for the Text component
 */
export interface TextProps extends RNTextProps {
  /** Text variant for size and weight */
  variant?: TextVariant;
  /** Text color */
  color?: TextColor;
  /** Bold text */
  bold?: boolean;
  /** Italic text */
  italic?: boolean;
  /** Center aligned text */
  center?: boolean;
  /** Additional class names */
  className?: string;
  /** Children content */
  children: React.ReactNode;
}

/**
 * Variant to class mapping
 */
const variantClasses: Record<TextVariant, string> = {
  h1: "text-4xl font-bold",
  h2: "text-3xl font-bold",
  h3: "text-2xl font-semibold",
  h4: "text-xl font-semibold",
  body: "text-base",
  "body-sm": "text-sm",
  caption: "text-xs",
  label: "text-sm font-medium",
};

/**
 * Color to class mapping
 */
const colorClasses: Record<TextColor, string> = {
  default: "text-text",
  secondary: "text-text-secondary",
  muted: "text-text-muted",
  inverse: "text-text-inverse",
  primary: "text-primary-500",
  error: "text-error",
  success: "text-success",
  warning: "text-warning",
};

/**
 * Text component for consistent typography
 */
export function Text({
  variant = "body",
  color = "default",
  bold = false,
  italic = false,
  center = false,
  className,
  children,
  ...props
}: TextProps) {
  return (
    <RNText
      className={cn(
        variantClasses[variant],
        colorClasses[color],
        bold && "font-bold",
        italic && "italic",
        center && "text-center",
        className
      )}
      {...props}
    >
      {children}
    </RNText>
  );
}
