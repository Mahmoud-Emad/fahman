/**
 * BlockedUsersScreen - View and manage blocked users
 */
import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Text, Icon, Avatar, EmptyState, Pressable } from "@/components/ui";
import { TopNavBar } from "@/components/navigation";
import { colors } from "@/themes";
import { friendsService, type Friend } from "@/services/friendsService";

interface BlockedUser {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  gameId: number;
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function BlockedUsersScreen() {
  const navigation = useNavigation();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch blocked users
  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await friendsService.getBlockedUsers();

      if (response.success && response.data) {
        setBlockedUsers(response.data);
      } else {
        setError("Failed to load blocked users");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (user: BlockedUser) => {
    Alert.alert(
      "Unblock User",
      `Are you sure you want to unblock ${user.displayName || user.username}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await friendsService.unblockUser(user.id);

              if (response.success) {
                // Remove from list
                setBlockedUsers((prev) => prev.filter((u) => u.id !== user.id));
              }
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to unblock user");
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Top Navigation */}
      <TopNavBar
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        centerTitle="Blocked Users"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {loading ? (
          // Loading state
          <View className="flex-1 items-center justify-center p-8">
            <Text variant="body" style={{ color: colors.neutral[500] }}>
              Loading blocked users...
            </Text>
          </View>
        ) : error ? (
          // Error state
          <View className="flex-1 items-center justify-center p-8">
            <Icon name="alert-circle" size="xl" color={colors.error} />
            <Text
              variant="h4"
              className="mt-4 text-center"
              style={{ color: colors.text.primary }}
            >
              Error
            </Text>
            <Text
              variant="body"
              className="mt-2 text-center"
              style={{ color: colors.neutral[500] }}
            >
              {error}
            </Text>
            <Pressable
              onPress={fetchBlockedUsers}
              className="mt-4 px-6 py-3 rounded-xl"
              style={{ backgroundColor: colors.primary[500] }}
              delayPressIn={0}
            >
              <Text
                variant="body"
                className="font-semibold"
                style={{ color: colors.white }}
              >
                Try Again
              </Text>
            </Pressable>
          </View>
        ) : blockedUsers.length === 0 ? (
          // Empty state
          <View className="flex-1 items-center justify-center">
            <EmptyState
              icon="ban"
              title="No blocked users"
              description="You haven't blocked anyone yet. Blocked users cannot send you messages or friend requests."
            />
          </View>
        ) : (
          // Blocked users list
          <View className="py-4">
            <View className="px-4 pb-2">
              <Text variant="caption" style={{ color: colors.neutral[500] }}>
                {blockedUsers.length} blocked user{blockedUsers.length > 1 ? "s" : ""}
              </Text>
            </View>

            {blockedUsers.map((user) => (
              <View
                key={user.id}
                className="flex-row items-center px-4 py-3 border-b"
                style={{ borderBottomColor: colors.border }}
              >
                {/* Avatar */}
                <Avatar
                  initials={getInitials(user.displayName || user.username)}
                  size="md"
                  source={user.avatar ? { uri: user.avatar } : undefined}
                />

                {/* User info */}
                <View className="flex-1 ml-3">
                  <Text variant="body" className="font-semibold" numberOfLines={1}>
                    {user.displayName || user.username}
                  </Text>
                  <Text
                    variant="caption"
                    style={{ color: colors.neutral[500] }}
                    numberOfLines={1}
                  >
                    @{user.username} • ID: {user.gameId}
                  </Text>
                </View>

                {/* Unblock button */}
                <Pressable
                  onPress={() => handleUnblock(user)}
                  className="px-4 py-2 rounded-full"
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.neutral[200] : colors.neutral[100],
                  })}
                  delayPressIn={0}
                >
                  <Text
                    variant="body-sm"
                    className="font-medium"
                    style={{ color: colors.neutral[600] }}
                  >
                    Unblock
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
