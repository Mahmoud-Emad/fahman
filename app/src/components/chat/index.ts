/**
 * Chat component exports
 *
 * Unified chat components for both room chat and direct messaging.
 */
export {
  ChatBubble,
  type ChatBubbleProps,
  type SystemMessageVariant,
  type ChatMessageStatus,
} from "./ChatBubble";

export {
  ChatView,
  type ChatViewProps,
  type ChatViewMessage,
} from "./ChatView";

// Re-exports for convenience
export { MessageInput } from "./MessageInput";
export { RoomInviteCard } from "./RoomInviteCard";
