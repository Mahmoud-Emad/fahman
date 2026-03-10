/**
 * UserSelectModal - Select users to send room invitations
 * Uses MultiSelectModal + SelectableItem for consistent patterns.
 */
import React from "react";
import { View } from "react-native";
import {
  MultiSelectModal,
  SelectableItem,
  Text,
  Icon,
  Skeleton,
} from "@/components/ui";
import { colors, withOpacity } from "@/themes";

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
 * Skeleton for loading state
 */
function UserListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
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
      ))}
    </View>
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
  // Sort: online users first
  const sortedUsers = [...users].sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <MultiSelectModal<InviteUser>
      visible={visible}
      onClose={onClose}
      title="Invite Players"
      data={sortedUsers}
      renderItem={(user, isSelected, onToggle) => (
        <SelectableItem
          selected={isSelected}
          onPress={onToggle}
          avatar={user.avatar}
          initials={user.initials}
          showOnlineIndicator={!!user.isOnline}
          isOnline={!!user.isOnline}
          title={user.name}
          subtitle={user.isFriend ? "Friend" : undefined}
          badge={
            user.isOnline
              ? { variant: "success", label: "Online" }
              : undefined
          }
        />
      )}
      keyExtractor={(u) => u.id}
      onSubmit={onSendInvites}
      submitLabel={(count) =>
        count > 0
          ? `Send Invites (${count})`
          : "Select players to invite"
      }
      searchable
      searchPlaceholder="Search players..."
      filterFn={(user, query) =>
        user.name.toLowerCase().includes(query)
      }
      isLoading={isLoading}
      loadingSkeleton={<UserListSkeleton count={5} />}
      emptyState={{
        icon: "people",
        title: "No friends available",
        description: "Add friends to invite them to your game",
      }}
      noResultsState={{
        icon: "search",
        title: "No players found",
        variant: "search",
      }}
      headerContent={
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
      }
    />
  );
}
