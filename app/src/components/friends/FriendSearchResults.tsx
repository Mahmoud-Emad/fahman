/**
 * FriendSearchResults - Search result list for AddFriendModal
 */
import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Text, Icon, Avatar, EmptyState, Pressable } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { type UserSearchResult } from "@/services/friendsService";
import { transformUrl } from "@/utils/transformUrl";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Single user search result row
 */
export function UserResultItem({
  user,
  onSendRequest,
  onCancelRequest,
  onViewProfile,
  isLoading,
}: {
  user: UserSearchResult;
  onSendRequest: (user: UserSearchResult) => void;
  onCancelRequest: (user: UserSearchResult) => void;
  onViewProfile: (userId: string) => void;
  isLoading: boolean;
}) {
  const displayName = user.displayName || user.username;
  const initials = getInitials(displayName);
  const isFriend = user.isFriend;
  const hasPending = user.hasPendingRequest;
  const isSentByMe = user.isSentByMe;

  return (
    <Pressable
      onPress={() => onViewProfile(user.id)}
      className="flex-row items-center px-4 py-3 border-b active:bg-neutral-50"
      style={{ borderBottomColor: colors.border }}
      delayPressIn={0}
    >
      <Avatar
        initials={initials}
        size="md"
        source={user.avatar ? { uri: transformUrl(user.avatar) || user.avatar } : undefined}
      />

      <View className="flex-1 ml-3">
        <Text variant="body" className="font-semibold" numberOfLines={1}>
          {displayName}
        </Text>
        <Text variant="caption" style={{ color: colors.neutral[500] }} numberOfLines={1}>
          @{user.username} • ID: {user.gameId}
        </Text>
      </View>

      {isFriend ? (
        <View
          className="flex-row items-center px-3 py-1.5 rounded-full"
          style={{ backgroundColor: withOpacity(colors.success, 0.1) }}
        >
          <Icon name="checkmark-circle" customSize={14} color={colors.success} />
          <Text variant="caption" className="ml-1.5 font-medium" style={{ color: colors.success }}>
            Friends
          </Text>
        </View>
      ) : hasPending && isSentByMe ? (
        <Pressable
          onPress={(e) => { e.stopPropagation(); onCancelRequest(user); }}
          disabled={isLoading}
          className="flex-row items-center px-3 py-1.5 rounded-full"
          style={{ backgroundColor: colors.neutral[100] }}
          delayPressIn={0}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.neutral[500]} />
          ) : (
            <>
              <Icon name="time" customSize={14} color={colors.neutral[500]} />
              <Text variant="caption" className="ml-1.5 font-medium" style={{ color: colors.neutral[500] }}>
                Cancel
              </Text>
            </>
          )}
        </Pressable>
      ) : hasPending ? (
        <View
          className="flex-row items-center px-3 py-1.5 rounded-full"
          style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
        >
          <Icon name="person-add" customSize={14} color={colors.primary[500]} />
          <Text variant="caption" className="ml-1.5 font-medium" style={{ color: colors.primary[500] }}>
            Respond
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={(e) => { e.stopPropagation(); onSendRequest(user); }}
          disabled={isLoading}
          className="flex-row items-center px-3 py-1.5 rounded-full"
          style={{ backgroundColor: colors.primary[500] }}
          delayPressIn={0}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Icon name="person-add" customSize={14} color={colors.white} />
              <Text variant="caption" className="ml-1.5 font-semibold" style={{ color: colors.white }}>
                Add
              </Text>
            </>
          )}
        </Pressable>
      )}
    </Pressable>
  );
}

/**
 * Loading skeleton for search results
 */
export function SearchResultSkeleton() {
  return (
    <View className="px-4 py-3">
      {[1, 2, 3].map((i) => (
        <View key={i} className="flex-row items-center py-3 border-b" style={{ borderBottomColor: colors.border }}>
          <View className="w-11 h-11 rounded-full" style={{ backgroundColor: colors.neutral[200] }} />
          <View className="flex-1 ml-3">
            <View className="h-4 rounded w-32" style={{ backgroundColor: colors.neutral[200] }} />
            <View className="h-3 rounded w-24 mt-2" style={{ backgroundColor: colors.neutral[100] }} />
          </View>
          <View className="w-16 h-8 rounded-full" style={{ backgroundColor: colors.neutral[200] }} />
        </View>
      ))}
    </View>
  );
}

interface FriendSearchResultsProps {
  searchResults: UserSearchResult[];
  isSearching: boolean;
  hasSearched: boolean;
  searchQuery: string;
  sendingTo: string | null;
  onSendRequest: (user: UserSearchResult) => void;
  onCancelRequest: (user: UserSearchResult) => void;
  onViewProfile: (userId: string) => void;
}

/**
 * Results area with loading, empty, and populated states
 */
export function FriendSearchResults({
  searchResults,
  isSearching,
  hasSearched,
  searchQuery,
  sendingTo,
  onSendRequest,
  onCancelRequest,
  onViewProfile,
}: FriendSearchResultsProps) {
  const noResults = hasSearched && searchResults.length === 0 && !isSearching;
  const showResults = searchResults.length > 0;

  if (isSearching && !hasSearched) {
    return <SearchResultSkeleton />;
  }

  if (noResults) {
    return (
      <View className="flex-1 justify-center" style={{ minHeight: 200 }}>
        <EmptyState
          icon="search"
          title="No users found"
          description={`No users matching "${searchQuery}"`}
          variant="search"
        />
      </View>
    );
  }

  if (showResults) {
    return (
      <View>
        <View className="px-4 pb-2">
          <Text variant="caption" style={{ color: colors.neutral[500] }}>
            {searchResults.length} result{searchResults.length > 1 ? "s" : ""}
          </Text>
        </View>
        {searchResults.map((user) => (
          <UserResultItem
            key={user.id}
            user={user}
            onSendRequest={onSendRequest}
            onCancelRequest={onCancelRequest}
            onViewProfile={onViewProfile}
            isLoading={sendingTo === user.id}
          />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center px-4" style={{ minHeight: 200 }}>
      <View className="items-center">
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
        >
          <Icon name="person-add" size="xl" color={colors.primary[500]} />
        </View>
        <Text variant="body" className="text-center font-medium" style={{ color: colors.text.primary }}>
          Find friends to play with
        </Text>
        <Text variant="body-sm" className="text-center mt-1" style={{ color: colors.neutral[500] }}>
          Search by their username or Game ID
        </Text>
      </View>
    </View>
  );
}
