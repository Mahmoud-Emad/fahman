/**
 * MultiSelectModal - Modal with multi-select list and submit action
 *
 * Extends ListModal with selection state, count display, and submit button.
 */
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { View, ScrollView, Animated } from "react-native";
import { Modal } from "./Modal";
import { Text } from "./Text";
import { Button } from "./Button";
import { SearchInput } from "./SearchInput";
import { EmptyState, type EmptyStateProps } from "./EmptyState";
import { Pressable } from "./Pressable";
import { colors } from "@/themes";

export interface MultiSelectModalProps<T> {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title: string;

  // --- Data ---
  /** Items to display */
  data: T[];
  /** Render function for each item (receives selection state) */
  renderItem: (item: T, isSelected: boolean, onToggle: () => void) => React.ReactNode;
  /** Unique key extractor */
  keyExtractor: (item: T) => string;

  // --- Selection ---
  /** Maximum number of selections (0 = unlimited) */
  maxSelections?: number;
  /** Submit button label (can be a function receiving count) */
  submitLabel?: string | ((count: number) => string);
  /** Callback when submit is pressed with selected IDs */
  onSubmit: (selectedIds: string[]) => void;

  // --- Search ---
  /** Enable search */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Client-side filter function */
  filterFn?: (item: T, query: string) => boolean;

  // --- States ---
  /** Whether data is loading */
  isLoading?: boolean;
  /** Skeleton for loading state */
  loadingSkeleton?: React.ReactNode;
  /** Empty state config */
  emptyState?: EmptyStateProps;
  /** No results state config */
  noResultsState?: EmptyStateProps;

  // --- Header extras ---
  /** Extra content above the list */
  headerContent?: React.ReactNode;
}

/**
 * MultiSelectModal component
 *
 * @example
 * ```tsx
 * <MultiSelectModal
 *   visible={visible}
 *   onClose={onClose}
 *   title="Invite Players"
 *   data={users}
 *   renderItem={(user, isSelected, onToggle) => (
 *     <SelectableItem
 *       selected={isSelected}
 *       onPress={onToggle}
 *       title={user.name}
 *       initials={user.initials}
 *       selectionMode="multi"
 *     />
 *   )}
 *   keyExtractor={(u) => u.id}
 *   onSubmit={(ids) => sendInvites(ids)}
 *   submitLabel={(count) => `Send Invites (${count})`}
 *   searchable
 *   searchPlaceholder="Search players..."
 *   filterFn={(u, q) => u.name.toLowerCase().includes(q)}
 * />
 * ```
 */
export function MultiSelectModal<T>({
  visible,
  onClose,
  title,
  data,
  renderItem,
  keyExtractor,
  maxSelections = 0,
  submitLabel = "Confirm",
  onSubmit,
  searchable = false,
  searchPlaceholder = "Search...",
  filterFn,
  isLoading = false,
  loadingSkeleton,
  emptyState,
  noResultsState,
  headerContent,
}: MultiSelectModalProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Reset selection when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedIds(new Set());
      setSearchQuery("");
    }
  }, [visible]);

  const toggleItem = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (maxSelections > 0 && next.size >= maxSelections) return prev;
          next.add(id);
        }
        return next;
      });
    },
    [maxSelections]
  );

  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery.trim() || !filterFn) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) => filterFn(item, query));
  }, [data, searchQuery, searchable, filterFn]);

  const isEmpty = data.length === 0 && !isLoading;
  const noResults =
    filteredData.length === 0 && searchQuery.trim() !== "" && !isLoading;
  const selectedCount = selectedIds.size;

  const handleSubmit = () => {
    if (selectedCount > 0) {
      onSubmit(Array.from(selectedIds));
      setSelectedIds(new Set());
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchQuery("");
    onClose();
  };

  const buttonLabel =
    typeof submitLabel === "function"
      ? submitLabel(selectedCount)
      : submitLabel;

  // Crossfade
  const fadeAnim = useRef(new Animated.Value(isLoading ? 0 : 1)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isLoading ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isLoading, fadeAnim]);

  return (
    <Modal visible={visible} onClose={handleClose} title={title}>
      <View className="flex-1">
        {/* Header extras */}
        {headerContent}

        {/* Search */}
        {searchable && (
          <View className="mb-4">
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={searchPlaceholder}
            />
          </View>
        )}

        {/* Selection count */}
        {selectedCount > 0 && (
          <View className="flex-row items-center justify-between mb-3">
            <Text variant="body-sm" color="secondary">
              {selectedCount} selected
            </Text>
            <Pressable
              onPress={() => setSelectedIds(new Set())}
              delayPressIn={0}
            >
              <Text
                variant="body-sm"
                className="font-medium"
                style={{ color: colors.primary[500] }}
              >
                Clear all
              </Text>
            </Pressable>
          </View>
        )}

        {/* List */}
        <View style={{ flex: 1 }}>
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

          <Animated.View
            style={{ flex: 1, opacity: fadeAnim }}
            pointerEvents={isLoading ? "none" : "auto"}
          >
            <ScrollView
              className="flex-1 -mx-6 px-6"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ minHeight: 300 }}
            >
              {isEmpty && emptyState ? (
                <View
                  className="flex-1 justify-center"
                  style={{ minHeight: 250 }}
                >
                  <EmptyState {...emptyState} />
                </View>
              ) : noResults && noResultsState ? (
                <View
                  className="flex-1 justify-center"
                  style={{ minHeight: 250 }}
                >
                  <EmptyState {...noResultsState} />
                </View>
              ) : (
                <View>
                  {filteredData.map((item) => {
                    const id = keyExtractor(item);
                    return (
                      <React.Fragment key={id}>
                        {renderItem(
                          item,
                          selectedIds.has(id),
                          () => toggleItem(id)
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>

        {/* Submit button */}
        <View className="mt-4">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={selectedCount === 0}
            onPress={handleSubmit}
          >
            {selectedCount > 0 ? buttonLabel : "Select items"}
          </Button>
        </View>
      </View>
    </Modal>
  );
}
