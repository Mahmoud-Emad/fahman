/**
 * UserSelectModal - Select users to send room invitations
 * Shows list of friends/users with multi-select capability
 */
import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, ScrollView, Animated } from "react-native";
import {
  Modal,
  Text,
  Icon,
  Button,
  Avatar,
  Badge,
  SearchInput,
  EmptyState,
  Pressable,
  Skeleton,
} from "@/components/ui";
import { colors, withOpacity } from "@/themes";

/**
 * Skeleton for user card while loading
 */
function UserCardSkeleton() {
  return (
    <View
      className="flex-row items-center p-3 rounded-xl mb-2"
      style={{
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Skeleton.Circle size={24} className="mr-3" />
      <Skeleton.Circle size={40} className="mr-3" />
      <View className="flex-1">
        <Skeleton.Box width="60%" height={16} className="mb-1" />
        <Skeleton.Box width="30%" height={12} />
      </View>
    </View>
  );
}

/**
 * Skeleton list for loading state
 */
function UserListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <UserCardSkeleton key={i} />
      ))}
    </View>
  );
}

export interface InviteUser {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  isOnline?: boolean;
  isFriend?: boolean;
}

interface UserSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSendInvites: (userIds: string[]) => void;
  users: InviteUser[];
  roomCode: string;
  packName: string;
  isLoading?: boolean;
}

/**
 * User card for selection
 */
function UserCard({
  user,
  isSelected,
  onToggle,
}: {
  user: InviteUser;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      delayPressIn={0}
      className="flex-row items-center p-3 rounded-xl mb-2 active:opacity-70"
      style={{
        backgroundColor: isSelected
          ? withOpacity(colors.primary[500], 0.1)
          : colors.white,
        borderWidth: 1,
        borderColor: isSelected ? colors.primary[500] : colors.border,
      }}
    >
      {/* Selection Indicator */}
      <View
        className="w-6 h-6 rounded-full items-center justify-center mr-3"
        style={{
          backgroundColor: isSelected
            ? colors.primary[500]
            : colors.neutral[100],
          borderWidth: isSelected ? 0 : 1,
          borderColor: colors.neutral[300],
        }}
      >
        {isSelected && (
          <Icon name="checkmark" customSize={14} color={colors.white} />
        )}
      </View>

      {/* Avatar */}
      <View className="relative mr-3">
        <Avatar source={user.avatar} initials={user.initials} size="sm" />
        {user.isOnline && (
          <View
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
            style={{
              backgroundColor: colors.success,
              borderWidth: 2,
              borderColor: colors.white,
            }}
          />
        )}
      </View>

      {/* User Info */}
      <View className="flex-1">
        <Text variant="body" className="font-medium">
          {user.name}
        </Text>
        {user.isFriend && (
          <Text variant="caption" color="muted">
            Friend
          </Text>
        )}
      </View>

      {/* Online Status */}
      {user.isOnline && (
        <Badge variant="success" size="sm">
          Online
        </Badge>
      )}
    </Pressable>
  );
}

/**
 * User selection modal for in-app invitations
 */
export function UserSelectModal({
  visible,
  onClose,
  onSendInvites,
  users,
  roomCode,
  packName,
  isLoading = false,
}: UserSelectModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const toggleUser = useCallback((userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const handleSend = () => {
    if (selectedIds.size > 0) {
      onSendInvites(Array.from(selectedIds));
      setSelectedIds(new Set());
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchQuery("");
    onClose();
  };

  // Filter users by search query
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate online and offline users
  const onlineUsers = filteredUsers.filter((u) => u.isOnline);
  const offlineUsers = filteredUsers.filter((u) => !u.isOnline);

  const selectedCount = selectedIds.size;
  const noResults = filteredUsers.length === 0 && searchQuery.trim();
  const isEmpty = users.length === 0 && !isLoading;

  // Smooth crossfade animation between loading and content
  const fadeAnim = useRef(new Animated.Value(isLoading ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isLoading ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isLoading, fadeAnim]);

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Invite Players"
      maxHeight="80%"
    >
      <View className="flex-1">
        {/* Room Info */}
        <View
          className="flex-row items-center p-3 rounded-xl mb-4"
          style={{ backgroundColor: withOpacity(colors.primary[500], 0.08) }}
        >
          <Icon name="game-controller" size="md" color={colors.primary[500]} />
          <View className="ml-3 flex-1">
            <Text variant="body-sm" className="font-medium">
              {packName}
            </Text>
            <Text variant="caption" color="muted">
              Room Code: {roomCode}
            </Text>
          </View>
        </View>

        {/* Search Input */}
        <View className="mb-4">
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search players..."
          />
        </View>

        {/* Selection Count */}
        {selectedCount > 0 && (
          <View className="flex-row items-center justify-between mb-3">
            <Text variant="body-sm" color="secondary">
              {selectedCount} player{selectedCount > 1 ? "s" : ""} selected
            </Text>
            <Pressable onPress={() => setSelectedIds(new Set())} delayPressIn={0}>
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

        {/* User List - fixed height ensures consistent modal size */}
        <View style={{ height: 300 }}>
          {/* Loading skeleton with fade out */}
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
            <UserListSkeleton count={5} />
          </Animated.View>

          {/* Content with fade in */}
          <Animated.View
            style={{
              flex: 1,
              opacity: fadeAnim,
            }}
            pointerEvents={isLoading ? "none" : "auto"}
          >
            <ScrollView
              className="flex-1 -mx-6 px-6"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ minHeight: 300 }}
            >
              {noResults ? (
                <View className="flex-1 justify-center" style={{ minHeight: 250 }}>
                  <EmptyState
                    icon="search"
                    title="No players found"
                    variant="search"
                  />
                </View>
              ) : isEmpty ? (
                <View className="flex-1 justify-center" style={{ minHeight: 250 }}>
                  <EmptyState
                    icon="people"
                    title="No friends available"
                    description="Add friends to invite them to your game"
                  />
                </View>
              ) : (
                <>
                  {/* Online Users */}
                  {onlineUsers.length > 0 && (
                    <>
                      <Text
                        variant="caption"
                        color="muted"
                        className="mb-2 font-medium"
                      >
                        ONLINE ({onlineUsers.length})
                      </Text>
                      {onlineUsers.map((user) => (
                        <UserCard
                          key={user.id}
                          user={user}
                          isSelected={selectedIds.has(user.id)}
                          onToggle={() => toggleUser(user.id)}
                        />
                      ))}
                    </>
                  )}

                  {/* Offline Users */}
                  {offlineUsers.length > 0 && (
                    <>
                      <Text
                        variant="caption"
                        color="muted"
                        className={`mb-2 font-medium ${onlineUsers.length > 0 ? "mt-4" : ""}`}
                      >
                        OFFLINE ({offlineUsers.length})
                      </Text>
                      {offlineUsers.map((user) => (
                        <UserCard
                          key={user.id}
                          user={user}
                          isSelected={selectedIds.has(user.id)}
                          onToggle={() => toggleUser(user.id)}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>

        {/* Send Button */}
        <View className="mt-4">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={selectedCount === 0}
            onPress={handleSend}
          >
            {selectedCount > 0
              ? `Send Invites (${selectedCount})`
              : "Select players to invite"}
          </Button>
        </View>
      </View>
    </Modal>
  );
}
