/**
 * UI Component exports for the Fahman app
 * All reusable UI components are exported from this file
 */

// Typography
export { Text, type TextProps, type TextVariant, type TextColor } from "./Text";

// Buttons & Actions
export {
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from "./Button";
export { GlassButton, type GlassButtonProps } from "./GlassButton";
export { Pressable, type PressableProps } from "./Pressable";

// Form Controls
export { Input, type InputProps, type InputVariant, type InputSize } from "./Input";
export {
  Switch,
  type SwitchProps,
  type SwitchSize,
} from "./Switch";
export {
  Checkbox,
  type CheckboxProps,
  type CheckboxSize,
} from "./Checkbox";
export { NumberStepper } from "./NumberStepper";

// Layout & Containers
export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  type CardProps,
  type CardVariant,
  type CardHeaderProps,
  type CardContentProps,
  type CardFooterProps,
} from "./Card";
export {
  Divider,
  type DividerProps,
  type DividerOrientation,
} from "./Divider";

// Feedback & Overlays
export {
  Modal,
  Dialog,
  type ModalProps,
  type DialogProps,
} from "./Modal";
export {
  Toast,
  type ToastProps,
  type ToastVariant,
  type ToastPosition,
} from "./Toast";

// Data Display
export { Badge, type BadgeProps, type BadgeVariant, type BadgeSize } from "./Badge";
export {
  Avatar,
  AvatarGroup,
  type AvatarProps,
  type AvatarSize,
  type AvatarGroupProps,
} from "./Avatar";

// Icons
export { Icon, type IconProps, type IconName, type IconSize } from "./Icon";

// Expandable
export { ExpandablePanel, type ExpandablePanelProps } from "./ExpandablePanel";

// Search
export { SearchInput, type SearchInputProps } from "./SearchInput";

// Empty State
export { EmptyState, type EmptyStateProps } from "./EmptyState";

// Segmented Control
export {
  SegmentedControl,
  type SegmentedControlProps,
  type Segment,
} from "./SegmentedControl";

// In-App Notification
export {
  InAppNotificationBanner,
  type InAppNotificationBannerProps,
} from "./InAppNotificationBanner";

// Skeleton Loading
export {
  Skeleton,
  SkeletonBox,
  SkeletonCircle,
  SkeletonText,
  SkeletonListItem,
  SkeletonCard,
} from "./Skeleton";
