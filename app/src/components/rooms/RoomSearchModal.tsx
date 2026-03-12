/**
 * RoomSearchModal - Search for rooms and users
 * Unified search across room names, room IDs, usernames, and game IDs
 *
 * Follows the same Modal + ScrollView pattern as FriendsListModal.
 */
import React, { useState, useCallback, useRef } from "react";
import { View, ScrollView, Keyboard, Pressable } from "react-native";
import { Modal, Text, Icon, Avatar, SearchInput, EmptyState } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { roomsService, type Room } from "@/services/roomsService";
import { friendsService, type UserSearchResult } from "@/services/friendsService";
import { getErrorMessage } from "@/utils/errorUtils";

interface RoomSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onRoomSelect: (room: Room) => void;
  onUserSelect?: (user: UserSearchResult) => void;
  onAddFriend?: (user: UserSearchResult) => void;
}

type SearchResultType = "room" | "user";

interface SearchResult {
  type: SearchResultType;
  id: string;
  data: Room | UserSearchResult;
}

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
 * Room result row
 */
function RoomResultCard({ room, onPress }: { room: Room; onPress: () => void }) {
  const statusColor = getStatusColor(room.status);
  const statusLabel = getStatusLabel(room.status);
  const isJoinable = room.status === "WAITING" || room.status === "PLAYING";

  return (
    <Pressable
      onPress={isJoinable ? onPress : undefined}
      delayPressIn={0}
      disabled={!isJoinable}
      className="flex-row items-center px-4 py-3 border-b"
      style={{
        borderBottomColor: colors.border,
        opacity: isJoinable ? 1 : 0.55,
      }}
    >
      <View
        className="w-12 h-12 rounded-xl items-center justify-center"
        style={{ backgroundColor: withOpacity(isJoinable ? colors.primary[500] : colors.neutral[400], 0.12) }}
      >
        <Icon name="game-controller" size="md" color={isJoinable ? colors.primary[500] : colors.neutral[400]} />
      </View>

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

      <View className="items-end">
        <View
          className="px-2.5 py-1 rounded-full"
          style={{ backgroundColor: withOpacity(statusColor, 0.12) }}
        >
          <Text variant="caption" className="font-semibold" style={{ color: statusColor }}>
            {statusLabel}
          </Text>
        </View>
        {isJoinable && (
          <Text variant="caption" style={{ color: colors.primary[500], marginTop: 2, fontSize: 10 }}>
            Tap to join
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/**
 * User result row
 */
function UserResultCard({
  user,
  onPress,
  onAddFriend,
}: {
  user: UserSearchResult;
  onPress: () => void;
  onAddFriend?: () => void;
}) {
  const displayName = user.displayName || user.username;
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      delayPressIn={0}
      className="flex-row items-center px-4 py-3 border-b"
      style={{ borderBottomColor: colors.border }}
    >
      <Avatar
        initials={initials}
        size="md"
        source={user.avatar ? { uri: user.avatar } : undefined}
      />

      <View className="flex-1 ml-3">
        <Text variant="body" className="font-semibold" numberOfLines={1}>
          {displayName}
        </Text>
        <Text variant="caption" style={{ color: colors.neutral[500] }} numberOfLines={1}>
          @{user.username} • ID: {user.gameId}
        </Text>
      </View>

      {user.isFriend ? (
        <View
          className="flex-row items-center px-2.5 py-1 rounded-full"
          style={{ backgroundColor: withOpacity(colors.success, 0.12) }}
        >
          <Icon name="checkmark-circle" customSize={12} color={colors.success} />
          <Text variant="caption" className="ml-1 font-medium" style={{ color: colors.success }}>
            Friend
          </Text>
        </View>
      ) : user.hasPendingRequest ? (
        <View
          className="flex-row items-center px-2.5 py-1 rounded-full"
          style={{ backgroundColor: withOpacity(colors.warning, 0.12) }}
        >
          <Icon name="time" customSize={12} color={colors.warning} />
          <Text variant="caption" className="ml-1 font-medium" style={{ color: colors.warning }}>
            Pending
          </Text>
        </View>
      ) : onAddFriend ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onAddFriend();
          }}
          delayPressIn={0}
          className="flex-row items-center px-3 py-1.5 rounded-full"
          style={{ backgroundColor: withOpacity(colors.primary[500], 0.12) }}
        >
          <Icon name="person-add" customSize={14} color={colors.primary[500]} />
          <Text variant="caption" className="ml-1 font-semibold" style={{ color: colors.primary[500] }}>
            Add
          </Text>
        </Pressable>
      ) : (
        <View
          className="flex-row items-center px-2.5 py-1 rounded-full"
          style={{ backgroundColor: withOpacity(colors.info, 0.12) }}
        >
          <Icon name="person" customSize={12} color={colors.info} />
          <Text variant="caption" className="ml-1 font-medium" style={{ color: colors.info }}>
            User
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Skeleton loading rows
 */
function SearchSkeleton() {
  return (
    <View className="px-4 py-3">
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className="flex-row items-center py-3 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          <View className="w-12 h-12 rounded-xl" style={{ backgroundColor: colors.neutral[200] }} />
          <View className="flex-1 ml-3">
            <View className="h-4 rounded w-32" style={{ backgroundColor: colors.neutral[200] }} />
            <View className="h-3 rounded w-24 mt-2" style={{ backgroundColor: colors.neutral[100] }} />
          </View>
          <View className="w-16 h-6 rounded-full" style={{ backgroundColor: colors.neutral[200] }} />
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
  onAddFriend,
}: RoomSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleClose = useCallback(() => {
    setSearchQuery("");
    setResults([]);
    setHasSearched(false);
    setError(null);
    onClose();
  }, [onClose]);

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const [roomsResponse, usersResponse] = await Promise.all([
        roomsService.searchRooms(query.trim()),
        friendsService.searchUsers(query.trim()),
      ]);

      const combined: SearchResult[] = [];

      if (roomsResponse.success && roomsResponse.data && Array.isArray(roomsResponse.data)) {
        roomsResponse.data.forEach((room) => {
          combined.push({ type: "room", id: `room-${room.id}`, data: room });
        });
      }

      if (usersResponse.success && usersResponse.data && Array.isArray(usersResponse.data)) {
        usersResponse.data.forEach((user) => {
          combined.push({ type: "user", id: `user-${user.id}`, data: user });
        });
      }

      setResults(combined);
      setHasSearched(true);
    } catch (err) {
      setError(getErrorMessage(err));
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => performSearch(text), 400);
    },
    [performSearch]
  );

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

  // Mark user as pending in local results after friend request is sent
  const handleAddFriend = useCallback(
    (user: UserSearchResult) => {
      if (!onAddFriend) return;
      onAddFriend(user);
      // Optimistically update the result to show "Pending"
      setResults(prev =>
        prev.map(r =>
          r.type === "user" && r.id === `user-${user.id}`
            ? { ...r, data: { ...r.data, hasPendingRequest: true } as UserSearchResult }
            : r
        )
      );
    },
    [onAddFriend]
  );

  const noResults = hasSearched && results.length === 0 && !isSearching;
  const showResults = results.length > 0;
  const roomCount = results.filter((r) => r.type === "room").length;
  const userCount = results.filter((r) => r.type === "user").length;

  return (
    <Modal visible={visible} onClose={handleClose} title="Search" padding="p-0">
      {/* Search Input */}
      <View className="px-4 pb-3">
        <SearchInput
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search rooms or users..."
          autoFocus
        />
        <Text variant="caption" className="mt-2" style={{ color: colors.neutral[500] }}>
          Search by room name, room ID, user name, or user ID
        </Text>
      </View>

      {/* Error */}
      {error && (
        <View
          className="mx-4 mb-3 px-4 py-3 rounded-xl flex-row items-center"
          style={{ backgroundColor: withOpacity(colors.error, 0.1) }}
        >
          <Icon name="alert-circle" customSize={18} color={colors.error} />
          <Text variant="body-sm" className="ml-2 flex-1" style={{ color: colors.error }}>
            {error}
          </Text>
        </View>
      )}

      {/* Content */}
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24, minHeight: 400 }}
          keyboardShouldPersistTaps="handled"
        >
          {isSearching && !hasSearched ? (
            <SearchSkeleton />
          ) : noResults ? (
            <View className="flex-1 justify-center" style={{ minHeight: 300 }}>
              <EmptyState
                icon="search"
                title="No results found"
                description={`No rooms or users matching "${searchQuery}"`}
                variant="search"
              />
            </View>
          ) : showResults ? (
            <View>
              <View className="px-4 pb-2 flex-row items-center">
                <Text variant="caption" style={{ color: colors.neutral[500] }}>
                  {results.length} result{results.length > 1 ? "s" : ""}
                </Text>
                {roomCount > 0 && userCount > 0 && (
                  <Text variant="caption" style={{ color: colors.neutral[400] }}>
                    {" "}({roomCount} room{roomCount > 1 ? "s" : ""}, {userCount} user{userCount > 1 ? "s" : ""})
                  </Text>
                )}
              </View>

              {results.map((result) =>
                result.type === "room" ? (
                  <RoomResultCard
                    key={result.id}
                    room={result.data as Room}
                    onPress={() => handleResultPress(result)}
                  />
                ) : (
                  <UserResultCard
                    key={result.id}
                    user={result.data as UserSearchResult}
                    onPress={() => handleResultPress(result)}
                    onAddFriend={
                      onAddFriend
                        ? () => handleAddFriend(result.data as UserSearchResult)
                        : undefined
                    }
                  />
                )
              )}
            </View>
          ) : (
            <View className="flex-1 justify-center px-4" style={{ minHeight: 300 }}>
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
      </View>
    </Modal>
  );
}
