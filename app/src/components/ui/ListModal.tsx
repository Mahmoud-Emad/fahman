/**
 * ListModal - Reusable modal with search, loading crossfade, empty states,
 * scrollable list, and optional footer action.
 *
 * Consolidates the repeated pattern from ChatsListModal, FriendsListModal,
 * NotificationsModal, PlayersModal, and UserSelectModal.
 */
import React, { useState, useMemo, useEffect, useRef } from "react";
import { View, ScrollView, Animated, type ViewStyle } from "react-native";
import { Modal, type ModalProps } from "./Modal";
import { Text } from "./Text";
import { Icon } from "./Icon";
import { Pressable } from "./Pressable";
import { SearchInput } from "./SearchInput";
import { EmptyState, type EmptyStateProps } from "./EmptyState";
import { colors } from "@/themes";

export interface ListModalProps<T> {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title (passed to Modal) */
  title: string;

  // --- Data ---
  /** The list items to display */
  data: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Unique key extractor for each item */
  keyExtractor: (item: T) => string;

  // --- Search (optional) ---
  /** Enable search input */
  searchable?: boolean;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Client-side filter function; receives each item and the current query */
  filterFn?: (item: T, query: string) => boolean;

  // --- States ---
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Skeleton shown while loading */
  loadingSkeleton?: React.ReactNode;
  /** Empty state config when data array is empty */
  emptyState?: EmptyStateProps;
  /** Empty state config when search yields no results */
  noResultsState?: EmptyStateProps;

  // --- Header extras ---
  /** Extra content rendered between search and list (e.g. tabs, banners) */
  headerContent?: React.ReactNode;

  // --- Footer action ---
  /** Optional footer button shown below the list */
  footerAction?: {
    icon?: string;
    label: string;
    onPress: () => void;
  };

  /** Hide footer when the list is empty */
  hideFooterWhenEmpty?: boolean;

  /** Min-height for the empty state wrapper (default 350) */
  emptyMinHeight?: number;

  /** Additional modal props */
  modalProps?: Partial<ModalProps>;

  /** Style for the scroll content container */
  contentContainerStyle?: ViewStyle;
}

/**
 * ListModal component
 *
 * @example
 * ```tsx
 * <ListModal
 *   visible={visible}
 *   onClose={onClose}
 *   title="Chats"
 *   data={conversations}
 *   renderItem={(conv) => <ConversationItem conversation={conv} />}
 *   keyExtractor={(conv) => conv.id}
 *   searchable
 *   searchPlaceholder="Search conversations..."
 *   filterFn={(conv, q) => conv.participants.some(p => p.name.toLowerCase().includes(q))}
 *   isLoading={isLoading}
 *   loadingSkeleton={<ConversationSkeletonList count={6} />}
 *   emptyState={{ icon: "chatbubbles", title: "No conversations yet" }}
 *   footerAction={{ icon: "add-circle", label: "New Conversation", onPress: onNewChat }}
 * />
 * ```
 */
export function ListModal<T>({
  visible,
  onClose,
  title,
  data,
  renderItem,
  keyExtractor,
  searchable = false,
  searchPlaceholder = "Search...",
  filterFn,
  isLoading = false,
  loadingSkeleton,
  emptyState,
  noResultsState,
  headerContent,
  footerAction,
  hideFooterWhenEmpty = true,
  emptyMinHeight = 350,
  modalProps,
  contentContainerStyle,
}: ListModalProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter data by search query when a filter function is provided
  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery.trim() || !filterFn) {
      return data;
    }
    const query = searchQuery.toLowerCase();
    return data.filter((item) => filterFn(item, query));
  }, [data, searchQuery, searchable, filterFn]);

  const isEmpty = data.length === 0 && !isLoading;
  const noResults =
    filteredData.length === 0 && searchQuery.trim() !== "" && !isLoading;

  // Smooth crossfade animation between skeleton and content
  const fadeAnim = useRef(new Animated.Value(isLoading ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isLoading ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isLoading, fadeAnim]);

  const showFooter =
    footerAction && (!hideFooterWhenEmpty || !isEmpty);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      padding="p-0"
      {...modalProps}
    >
      {/* Header extras (tabs, banners, etc.) */}
      {headerContent}

      {/* Search Input */}
      {searchable && (
        <View className="px-4 pb-3">
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={searchPlaceholder}
          />
        </View>
      )}

      {/* List Area */}
      <View style={{ flex: 1 }}>
        {/* Loading skeleton with fade out */}
        {loadingSkeleton && (
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              opacity: Animated.subtract(1, fadeAnim),
            }}
            pointerEvents={isLoading ? "auto" : "none"}
          >
            {loadingSkeleton}
          </Animated.View>
        )}

        {/* Content with fade in */}
        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
          }}
          pointerEvents={isLoading ? "none" : "auto"}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              contentContainerStyle ?? { paddingBottom: 24, minHeight: 400 }
            }
          >
            {isEmpty && emptyState ? (
              <View
                className="flex-1 justify-center"
                style={{ minHeight: emptyMinHeight }}
              >
                <EmptyState {...emptyState} />
              </View>
            ) : noResults && noResultsState ? (
              <View
                className="flex-1 justify-center"
                style={{ minHeight: emptyMinHeight }}
              >
                <EmptyState {...noResultsState} />
              </View>
            ) : (
              <View>
                {filteredData.map((item, index) => (
                  <React.Fragment key={keyExtractor(item)}>
                    {renderItem(item, index)}
                  </React.Fragment>
                ))}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Footer Action */}
      {showFooter && (
        <View
          className="px-4 pt-2 border-t"
          style={{ borderTopColor: colors.border }}
        >
          <Pressable
            onPress={footerAction.onPress}
            delayPressIn={0}
            className="flex-row items-center justify-center py-3"
          >
            {footerAction.icon && (
              <Icon
                name={footerAction.icon as any}
                size="md"
                color={colors.primary[500]}
              />
            )}
            <Text
              variant="body"
              className={`font-medium ${footerAction.icon ? "ml-2" : ""}`}
              style={{ color: colors.primary[500] }}
            >
              {footerAction.label}
            </Text>
          </Pressable>
        </View>
      )}
    </Modal>
  );
}
