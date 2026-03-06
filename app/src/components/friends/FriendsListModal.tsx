/**
 * FriendsListModal - Modal for viewing friends list
 */
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { View, ScrollView, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import {
  Modal,
  Text,
  Icon,
  SearchInput,
  EmptyState,
  SegmentedControl,
  Pressable,
} from "@/components/ui";
import { colors } from "@/themes";
import { FriendItem, FriendRequestItem } from "./FriendItem";
import { FriendSkeletonList } from "./FriendItemSkeleton";
import type { Friend, FriendRequest } from "./types";
import type { RootStackParamList } from "../../../App";

interface FriendsListModalProps {
  visible: boolean;
  onClose: () => void;
  friends: Friend[];
  friendRequests?: FriendRequest[];
  sentRequests?: FriendRequest[];
  onFriendPress: (friend: Friend) => void;
  onMessageFriend?: (friend: Friend) => void;
  onInviteFriend?: (friend: Friend) => void;
  onAcceptRequest?: (request: FriendRequest) => void;
  onDeclineRequest?: (request: FriendRequest) => void;
  onCancelRequest?: (request: FriendRequest) => void;
  onAddFriend?: () => void;
  isLoading?: boolean;
}

/**
 * FriendsListModal component
 */
export function FriendsListModal({
  visible,
  onClose,
  friends,
  friendRequests = [],
  sentRequests = [],
  onFriendPress,
  onMessageFriend,
  onInviteFriend,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onAddFriend,
  isLoading = false,
}: FriendsListModalProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "sent">("friends");

  // Handle viewing a user's profile from friend request
  const handleViewProfile = useCallback((userId: string) => {
    // Close modal first, then navigate
    onClose();
    setTimeout(() => {
      navigation.navigate("UserProfile", { userId });
    }, 300);
  }, [navigation, onClose]);

  // Filter friends by search query
  const filteredFriends = useMemo(() => {
    let result = friends;

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.username.toLowerCase().includes(query)
      );
    }

    // Sort: online first, then in_game, then offline
    return result.sort((a, b) => {
      const order = { online: 0, in_game: 1, offline: 2 };
      return order[a.status] - order[b.status];
    });
  }, [friends, searchQuery]);

  const onlineCount = friends.filter(
    (f) => f.status === "online" || f.status === "in_game"
  ).length;
  const isEmpty = friends.length === 0 && !isLoading;
  const noResults =
    filteredFriends.length === 0 && searchQuery.trim() && !isLoading;

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
      onClose={onClose}
      title="Friends"
      padding="p-0"
    >
      {/* Tabs */}
      <View className="px-4 mb-3">
        <SegmentedControl
          segments={[
            { id: "friends", label: "Friends", count: friends.length },
            { id: "requests", label: "Requests", count: friendRequests.length },
            { id: "sent", label: "Sent", count: sentRequests.length },
          ]}
          activeSegment={activeTab}
          onChange={(id) => setActiveTab(id as "friends" | "requests" | "sent")}
        />
      </View>

      {/* Search Input (only for friends tab) */}
      {activeTab === "friends" && (
        <View className="px-4 pb-3">
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search friends..."
          />
        </View>
      )}

      {/* Content */}
      <View style={{ flex: 1 }}>
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
          <FriendSkeletonList count={5} />
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
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24, minHeight: 400 }}
          >
            {activeTab === "friends" ? (
              // Friends Tab
              isEmpty ? (
                <View className="flex-1 justify-center" style={{ minHeight: 250 }}>
                  <EmptyState
                    icon="people"
                    title="No friends yet"
                    description="Add friends to play games together"
                    action={
                      onAddFriend
                        ? { label: "Add Friends", onPress: onAddFriend }
                        : undefined
                    }
                  />
                </View>
              ) : noResults ? (
                <View className="flex-1 justify-center" style={{ minHeight: 250 }}>
                  <EmptyState
                    icon="search"
                    title="No friends found"
                    description="Try a different search term"
                    variant="search"
                  />
                </View>
              ) : (
                <View>
                  {/* Online count badge */}
                  {onlineCount > 0 && (
                    <View className="px-4 pb-2">
                      <Text variant="caption" style={{ color: colors.neutral[500] }}>
                        {onlineCount} friend{onlineCount > 1 ? "s" : ""} online
                      </Text>
                    </View>
                  )}
                  {filteredFriends.map((friend) => (
                    <FriendItem
                      key={friend.id}
                      friend={friend}
                      onPress={() => onFriendPress(friend)}
                      onMessage={
                        onMessageFriend ? () => onMessageFriend(friend) : undefined
                      }
                      onInvite={
                        onInviteFriend ? () => onInviteFriend(friend) : undefined
                      }
                    />
                  ))}
                </View>
              )
            ) : activeTab === "requests" ? (
              // Received Requests Tab
              friendRequests.length === 0 ? (
                <View className="flex-1 justify-center" style={{ minHeight: 250 }}>
                  <EmptyState
                    icon="person-add"
                    title="No friend requests"
                    description="You don't have any pending friend requests"
                  />
                </View>
              ) : (
                <View>
                  {friendRequests.map((request) => (
                    <FriendRequestItem
                      key={request.id}
                      request={request}
                      onAccept={() => onAcceptRequest?.(request)}
                      onDecline={() => onDeclineRequest?.(request)}
                      onViewProfile={handleViewProfile}
                    />
                  ))}
                </View>
              )
            ) : (
              // Sent Requests Tab
              sentRequests.length === 0 ? (
                <View className="flex-1 justify-center" style={{ minHeight: 250 }}>
                  <EmptyState
                    icon="paper-plane"
                    title="No sent requests"
                    description="You haven't sent any friend requests yet"
                  />
                </View>
              ) : (
                <View>
                  {sentRequests.map((request) => (
                    <FriendRequestItem
                      key={request.id}
                      request={request}
                      isSent
                      onCancel={() => onCancelRequest?.(request)}
                      onViewProfile={handleViewProfile}
                    />
                  ))}
                </View>
              )
            )}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Add Friend Button */}
      {onAddFriend && !isEmpty && (
        <View
          className="px-4 pt-2 border-t"
          style={{ borderTopColor: colors.border }}
        >
          <Pressable
            onPress={onAddFriend}
            delayPressIn={0}
            className="flex-row items-center justify-center py-3"
          >
            <Icon name="person-add" size="md" color={colors.primary[500]} />
            <Text
              variant="body"
              className="ml-2 font-medium"
              style={{ color: colors.primary[500] }}
            >
              Add Friend
            </Text>
          </Pressable>
        </View>
      )}
    </Modal>
  );
}
