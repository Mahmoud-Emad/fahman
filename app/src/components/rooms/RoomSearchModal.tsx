/**
 * RoomSearchModal - Search for rooms and users
 * Unified search across room names, room IDs, usernames, and game IDs
 */
import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, ScrollView, ActivityIndicator, Keyboard, Animated, Pressable } from "react-native";
import { Modal, Text, Icon, Avatar, SearchInput, EmptyState } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { roomsService, type Room } from "@/services/roomsService";
import { friendsService, type UserSearchResult } from "@/services/friendsService";

interface RoomSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onRoomSelect: (room: Room) => void;
  onUserSelect?: (user: UserSearchResult) => void;
}

type SearchResultType = "room" | "user";

interface SearchResult {
  type: SearchResultType;
  id: string;
  data: Room | UserSearchResult;
}

/**
 * Get status color for room
 */
function getStatusColor(status: Room["status"]): string {
  switch (status) {
    case "WAITING":
      return colors.primary[500];
    case "PLAYING":
      return colors.success;
    case "FINISHED":
    case "CLOSED":
      return colors.neutral[500];
    default:
      return colors.neutral[500];
  }
}

/**
 * Get status label for room
 */
function getStatusLabel(status: Room["status"]): string {
  switch (status) {
    case "WAITING":
      return "Waiting";
    case "PLAYING":
      return "Playing";
    case "FINISHED":
      return "Finished";
    case "CLOSED":
      return "Closed";
    default:
      return status;
  }
}

/**
 * Unified search result card
 */
function SearchResultCard({
  result,
  onPress,
}: {
  result: SearchResult;
  onPress: () => void;
}) {
  if (result.type === "room") {
    const room = result.data as Room;
    const statusColor = getStatusColor(room.status);
    const statusLabel = getStatusLabel(room.status);
    const initials = room.title.substring(0, 2).toUpperCase();

    return (
      <Pressable
        onPress={onPress}
        delayPressIn={0}
        className="flex-row items-center px-4 py-3 border-b active:bg-neutral-50"
        style={{ borderBottomColor: colors.border }}
      >
        {/* Room icon */}
        <View
          className="w-12 h-12 rounded-xl items-center justify-center"
          style={{ backgroundColor: withOpacity(colors.primary[500], 0.12) }}
        >
          <Icon name="game-controller" size="md" color={colors.primary[500]} />
        </View>

        {/* Room info */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text variant="body" className="font-semibold flex-1" numberOfLines={1}>
              {room.title}
            </Text>
            {!room.isPublic && (
              <Icon name="lock-closed" customSize={12} color={colors.neutral[400]} />
            )}
          </View>
          <View className="flex-row items-center mt-0.5">
            <Text variant="caption" style={{ color: colors.neutral[500] }}>
              Code: {room.code}
            </Text>
            <Text variant="caption" style={{ color: colors.neutral[400] }} className="mx-1">
              •
            </Text>
            <Text variant="caption" style={{ color: colors.neutral[500] }}>
              {room.currentPlayers} player{room.currentPlayers !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Status badge */}
        <View
          className="px-2.5 py-1 rounded-full"
          style={{ backgroundColor: withOpacity(statusColor, 0.12) }}
        >
          <Text
            variant="caption"
            className="font-semibold"
            style={{ color: statusColor }}
          >
            {statusLabel}
          </Text>
        </View>
      </Pressable>
    );
  }

  // User result
  const user = result.data as UserSearchResult;
  const displayName = user.displayName || user.username;
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      delayPressIn={0}
      className="flex-row items-center px-4 py-3 border-b active:bg-neutral-50"
      style={{ borderBottomColor: colors.border }}
    >
      {/* User avatar */}
      <Avatar
        initials={initials}
        size="md"
        source={user.avatar ? { uri: user.avatar } : undefined}
      />

      {/* User info */}
      <View className="flex-1 ml-3">
        <Text variant="body" className="font-semibold" numberOfLines={1}>
          {displayName}
        </Text>
        <Text variant="caption" style={{ color: colors.neutral[500] }} numberOfLines={1}>
          @{user.username} • ID: {user.gameId}
        </Text>
      </View>

      {/* User indicator */}
      <View
        className="flex-row items-center px-2.5 py-1 rounded-full"
        style={{ backgroundColor: withOpacity(colors.info, 0.12) }}
      >
        <Icon name="person" customSize={12} color={colors.info} />
        <Text
          variant="caption"
          className="ml-1 font-medium"
          style={{ color: colors.info }}
        >
          User
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Search result skeleton
 */
function SearchResultSkeleton() {
  return (
    <View className="px-4 py-3">
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className="flex-row items-center py-3 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          <View
            className="w-12 h-12 rounded-xl"
            style={{ backgroundColor: colors.neutral[200] }}
          />
          <View className="flex-1 ml-3">
            <View
              className="h-4 rounded w-32"
              style={{ backgroundColor: colors.neutral[200] }}
            />
            <View
              className="h-3 rounded w-24 mt-2"
              style={{ backgroundColor: colors.neutral[100] }}
            />
          </View>
          <View
            className="w-16 h-6 rounded-full"
            style={{ backgroundColor: colors.neutral[200] }}
          />
        </View>
      ))}
    </View>
  );
}

/**
 * RoomSearchModal component
 */
export function RoomSearchModal({
  visible,
  onClose,
  onRoomSelect,
  onUserSelect,
}: RoomSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce timer ref
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setSearchQuery("");
    setResults([]);
    setHasSearched(false);
    setError(null);
    onClose();
  }, [onClose]);

  // Perform search
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Search both rooms and users in parallel
      const [roomsResponse, usersResponse] = await Promise.all([
        roomsService.searchRooms(query.trim()),
        friendsService.searchUsers(query.trim()),
      ]);

      const combinedResults: SearchResult[] = [];

      // Add room results
      if (roomsResponse.success && roomsResponse.data && Array.isArray(roomsResponse.data)) {
        roomsResponse.data.forEach((room) => {
          combinedResults.push({
            type: "room",
            id: `room-${room.id}`,
            data: room,
          });
        });
      }

      // Add user results
      if (usersResponse.success && usersResponse.data && Array.isArray(usersResponse.data)) {
        usersResponse.data.forEach((user) => {
          combinedResults.push({
            type: "user",
            id: `user-${user.id}`,
            data: user,
          });
        });
      }

      setResults(combinedResults);
      setHasSearched(true);
    } catch (err: any) {
      setError(err.message || "Search failed");
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change with debounce
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);

      // Clear previous timeout
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      // Debounce search
      searchTimeout.current = setTimeout(() => {
        performSearch(text);
      }, 400);
    },
    [performSearch]
  );

  // Handle result press
  const handleResultPress = useCallback(
    (result: SearchResult) => {
      Keyboard.dismiss();
      if (result.type === "room") {
        onRoomSelect(result.data as Room);
        handleClose();
      } else if (onUserSelect) {
        onUserSelect(result.data as UserSearchResult);
        handleClose();
      }
    },
    [onRoomSelect, onUserSelect, handleClose]
  );

  const noResults = hasSearched && results.length === 0 && !isSearching;
  const showResults = results.length > 0;

  // Count by type
  const roomCount = results.filter((r) => r.type === "room").length;
  const userCount = results.filter((r) => r.type === "user").length;

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Search"
      padding="p-0"
    >
      {/* Search Section */}
      <View className="px-4 pb-3">
        <SearchInput
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search rooms or users..."
          autoFocus
        />

        {/* Helper text */}
        <Text
          variant="caption"
          className="mt-2"
          style={{ color: colors.neutral[500] }}
        >
          Search by room name, room ID, user name, or user ID
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View
          className="mx-4 mb-3 px-4 py-3 rounded-xl flex-row items-center"
          style={{ backgroundColor: withOpacity(colors.error, 0.1) }}
        >
          <Icon name="alert-circle" customSize={18} color={colors.error} />
          <Text
            variant="body-sm"
            className="ml-2 flex-1"
            style={{ color: colors.error }}
          >
            {error}
          </Text>
        </View>
      )}

      {/* Results */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, minHeight: 200 }}
        keyboardShouldPersistTaps="handled"
      >
        {isSearching && !hasSearched ? (
          <SearchResultSkeleton />
        ) : noResults ? (
          <View className="flex-1 justify-center" style={{ minHeight: 200 }}>
            <EmptyState
              icon="search"
              title="No results found"
              description={`No rooms or users matching "${searchQuery}"`}
              variant="search"
            />
          </View>
        ) : showResults ? (
          <View>
            {/* Results count */}
            <View className="px-4 pb-2 flex-row items-center">
              <Text variant="caption" style={{ color: colors.neutral[500] }}>
                {results.length} result{results.length > 1 ? "s" : ""}
              </Text>
              {roomCount > 0 && userCount > 0 && (
                <Text variant="caption" style={{ color: colors.neutral[400] }}>
                  {" "}
                  ({roomCount} room{roomCount > 1 ? "s" : ""}, {userCount} user
                  {userCount > 1 ? "s" : ""})
                </Text>
              )}
            </View>

            {/* Results list */}
            {results.map((result) => (
              <SearchResultCard
                key={result.id}
                result={result}
                onPress={() => handleResultPress(result)}
              />
            ))}
          </View>
        ) : (
          <View className="flex-1 justify-center px-4" style={{ minHeight: 200 }}>
            <View className="items-center">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
              >
                <Icon name="search" size="xl" color={colors.primary[500]} />
              </View>
              <Text
                variant="body"
                className="text-center font-medium"
                style={{ color: colors.text.primary }}
              >
                Find rooms to join
              </Text>
              <Text
                variant="body-sm"
                className="text-center mt-1"
                style={{ color: colors.neutral[500] }}
              >
                Search by room name, code, or player name
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </Modal>
  );
}
