/**
 * RoomsScreen - Display list of rooms created by users
 * Features: Smart event section with dynamic colors, carousel, user info, search
 */
import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { BottomNavBar } from "@/components/navigation";
import {
  RoomsHeader,
  RoomFilters,
  RoomSection,
  LoadingIndicator,
  JoinByIdButton,
  JoinRoomModal,
  RoomDetailsDialog,
  RoomSearchModal,
  useRoomData,
  useRoomFilters,
  useRoomDialogs,
} from "@/components/rooms";
import type { Room } from "@/services/roomsService";
import { PackSelectionModal } from "@/components/packs";
import type { PackData } from "@/components/packs/types";
import { CreateOptionsModal, BuyCoinsModal } from "@/components/common";
import {
  NotificationsModal,
  ChatsListModal,
  ChatDetailsModal,
} from "@/components/messaging";
import { FriendsListModal, AddFriendModal, CreateGameDialog } from "@/components/friends";
import { useMessaging, useFriends, useAuth, usePacks } from "@/hooks";
import { storeService } from "@/services/storeService";
import { useToast } from "@/contexts";
import { colors } from "@/themes";
import { transformUrl } from "@/utils/transformUrl";
import type { RootStackParamList } from "../../App";

type RoomsScreenNavigationProp = StackNavigationProp<RootStackParamList, "Rooms">;

/**
 * RoomsScreen component
 */
export function RoomsScreen() {
  const navigation = useNavigation<RoomsScreenNavigationProp>();
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [packModalVisible, setPackModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [buyCoinsVisible, setBuyCoinsVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [localCoins, setLocalCoins] = useState(user?.coins ?? 0);

  // Use centralized hooks
  const messaging = useMessaging();
  const friendsHook = useFriends();
  const packsHook = usePacks();

  // Sync local coins with user
  useEffect(() => {
    setLocalCoins(user?.coins ?? 0);
  }, [user?.coins]);

  // Coordinate friend press with chat opening
  useEffect(() => {
    if (friendsHook.pendingChatFriend) {
      const friend = friendsHook.pendingChatFriend;
      friendsHook.clearPendingChatFriend();
      messaging.openDirectChat({
        id: friend.id,
        name: friend.name,
        initials: friend.initials,
        avatar: friend.avatar,
      });
    }
  }, [friendsHook.pendingChatFriend]);

  const handleCoinsPurchased = async (packageId: string) => {
    try {
      const response = await storeService.purchaseCoins(packageId);

      if (response.success && response.data) {
        setLocalCoins(response.data.newBalance);
        await refreshUser();
        toast.success(`${response.data.coinsAdded} coins added!`);
        setBuyCoinsVisible(false);
      } else {
        toast.error(response.message || "Purchase failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to purchase coins");
    }
  };

  // Fetch packs when modal opens
  useEffect(() => {
    if (packModalVisible) {
      packsHook.fetchPacks();
    }
  }, [packModalVisible]);

  const handleHostPress = () => {
    setPackModalVisible(true);
  };

  const handlePackSelected = (pack: PackData) => {
    navigation.navigate("RoomConfig", { pack });
  };

  const handleCreatePack = () => {
    navigation.navigate("PackCreation", {});
  };

  // Handle room selection from search
  const handleSearchRoomSelect = (room: Room) => {
    setSearchModalVisible(false);
    // Transform to RoomData format for the details dialog
    const roomData = {
      id: room.id,
      title: room.title,
      description: room.description || undefined,
      logo: transformUrl(room.selectedPack?.imageUrl),
      logoInitials: room.title.substring(0, 2).toUpperCase(),
      type: room.isPublic ? "public" as const : "private" as const,
      users: room.members?.slice(0, 3).map((m) => ({
        id: m.user.id,
        initials: (m.user.displayName || m.user.username).substring(0, 2).toUpperCase(),
        avatar: transformUrl(m.user.avatar),
      })) || [],
      totalUsers: room.currentPlayers,
      questionsCount: 0,
      currentQuestion: room.currentQuestionIndex,
      status: room.status === "WAITING" ? "waiting" as const : room.status === "PLAYING" ? "playing" as const : "finished" as const,
    };
    // Slight delay to let search modal close
    setTimeout(() => {
      handleRoomPress(roomData);
    }, 100);
  };

  // Room data management (now includes myRooms from backend)
  const {
    events,
    rooms,
    exploreRooms,
    myRooms,
    isLoading,
    refreshing,
    loadingMore,
    myRoomsLoading,
    onRefresh,
    handleScrollEnd,
    refreshSilently,
  } = useRoomData();

  // Refresh room data when screen gains focus (e.g. after leaving a room)
  useFocusEffect(
    useCallback(() => {
      refreshSilently();
    }, [refreshSilently])
  );

  // Room filters
  const {
    privacyFilter,
    statusFilter,
    showMyRoomsOnly,
    setPrivacyFilter,
    setStatusFilter,
    setShowMyRoomsOnly,
    filterRooms,
  } = useRoomFilters();

  // Dialog management
  const {
    joinModalVisible,
    joinModalMode,
    selectedRoom,
    detailsDialogVisible,
    isJoining,
    handleRoomPress,
    handleDetailsJoin,
    handleJoinById,
    handleJoinSubmit,
    handleCloseJoinModal,
    handleCloseDetailsDialog,
  } = useRoomDialogs();

  // Apply filters
  const filteredRooms = filterRooms(rooms);
  const filteredExploreRooms = filterRooms(exploreRooms);
  const filteredMyRooms = filterRooms(myRooms);

  // Tab navigation
  const handleTabPress = (tabId: string) => {
    if (tabId === "create") {
      setCreateModalVisible(true);
    } else if (tabId === "friends") {
      friendsHook.openFriendsList();
    } else if (tabId === "chats") {
      messaging.openChatsList();
    } else if (tabId === "notifications") {
      messaging.openNotifications();
    } else if (tabId === "profile") {
      navigation.navigate("Profile");
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <RoomsHeader
        events={events}
        coins={localCoins}
        userAvatar={user?.avatar || undefined}
        userInitials={user?.displayName?.charAt(0).toUpperCase() ?? "U"}
        onSearchPress={() => setSearchModalVisible(true)}
        onAvatarPress={() => navigation.navigate("Profile")}
        onBackPress={() => navigation.goBack()}
        onHostPress={handleHostPress}
        onCoinsPress={() => setBuyCoinsVisible(true)}
      />

      {/* Filters */}
      <RoomFilters
        privacyFilter={privacyFilter}
        statusFilter={statusFilter}
        showMyRoomsOnly={showMyRoomsOnly}
        onPrivacyChange={setPrivacyFilter}
        onStatusChange={setStatusFilter}
        onMyRoomsToggle={setShowMyRoomsOnly}
      />

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
      >
        {showMyRoomsOnly ? (
          /* My Rooms Section (filter mode) */
          <RoomSection
            title="My Rooms"
            rooms={filteredMyRooms}
            isLoading={myRoomsLoading}
            onRoomPress={handleRoomPress}
            skeletonCount={6}
            emptyMessage="You haven't joined any rooms yet"
          />
        ) : (
          <>
            {/* Your Rooms Section - Shows user's active rooms */}
            {(myRooms.length > 0 || myRoomsLoading) && (
              <RoomSection
                title="Your Rooms"
                rooms={filterRooms(myRooms)}
                isLoading={myRoomsLoading}
                onRoomPress={handleRoomPress}
                skeletonCount={3}
                emptyMessage="You haven't joined any rooms yet"
              />
            )}

            {/* Popular Rooms Section - Top 6 by player count */}
            <RoomSection
              title="Popular Rooms"
              rooms={filteredRooms}
              isLoading={isLoading}
              onRoomPress={handleRoomPress}
              skeletonCount={6}
              emptyMessage="No popular rooms right now"
            />

            {/* Explore Rooms Section */}
            <RoomSection
              title="Explore Rooms"
              rooms={filteredExploreRooms}
              isLoading={isLoading}
              onRoomPress={handleRoomPress}
              skeletonCount={4}
              rightAction={<JoinByIdButton onPress={handleJoinById} />}
              emptyMessage="No rooms to explore"
            />

            {/* Loading indicator for infinite scroll */}
            <LoadingIndicator visible={loadingMore} />
          </>
        )}
      </ScrollView>

      {/* Room Details Dialog */}
      <RoomDetailsDialog
        room={selectedRoom}
        visible={detailsDialogVisible}
        onClose={handleCloseDetailsDialog}
        onJoin={handleDetailsJoin}
      />

      {/* Join Room Modal */}
      <JoinRoomModal
        visible={joinModalVisible}
        onClose={handleCloseJoinModal}
        mode={joinModalMode}
        roomTitle={selectedRoom?.title}
        onJoin={handleJoinSubmit}
        isLoading={isJoining}
      />

      {/* Bottom Navigation */}
      <BottomNavBar
        centerTab={{ id: "create", label: "Create", icon: "add-circle-outline", activeIcon: "add-circle" }}
        activeTab=""
        onTabPress={handleTabPress}
        badges={{
          notifications: messaging.unreadNotificationCount,
          chats: messaging.unreadMessageCount,
        }}
      />

      {/* Create Options Modal */}
      <CreateOptionsModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreateRoom={handleHostPress}
        onCreatePack={handleCreatePack}
      />

      {/* Pack Selection Modal */}
      <PackSelectionModal
        visible={packModalVisible}
        onClose={() => setPackModalVisible(false)}
        onNext={handlePackSelected}
        onCreatePack={handleCreatePack}
        suggestedPacks={packsHook.suggestedPacks}
        ownedPacks={packsHook.ownedPacks}
        popularPacks={packsHook.popularPacks}
        isLoading={packsHook.isLoading}
      />

      {/* Friends List Modal */}
      <FriendsListModal
        visible={friendsHook.friendsListVisible}
        onClose={() => friendsHook.setFriendsListVisible(false)}
        friends={friendsHook.friends}
        friendRequests={friendsHook.friendRequests}
        sentRequests={friendsHook.sentRequests}
        onFriendPress={friendsHook.handleFriendPress}
        onMessageFriend={friendsHook.handleMessageFriend}
        onInviteFriend={friendsHook.handleInviteFriend}
        onAcceptRequest={friendsHook.handleAcceptFriendRequest}
        onDeclineRequest={friendsHook.handleDeclineFriendRequest}
        onCancelRequest={friendsHook.handleCancelFriendRequest}
        onAddFriend={friendsHook.handleAddFriend}
        isLoading={friendsHook.friendsLoading}
      />

      {/* Add Friend Modal */}
      <AddFriendModal
        visible={friendsHook.addFriendVisible}
        onClose={() => friendsHook.setAddFriendVisible(false)}
        onCloseAll={friendsHook.closeAllModals}
        onFriendAdded={friendsHook.handleFriendAdded}
      />

      {/* Create Game Dialog (Play with Friend) */}
      <CreateGameDialog
        visible={!!friendsHook.playFriend}
        friend={friendsHook.playFriend}
        onClose={() => friendsHook.setPlayFriend(null)}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        visible={messaging.notificationsVisible}
        onClose={() => messaging.setNotificationsVisible(false)}
        notifications={messaging.notifications}
        onNotificationPress={messaging.handleNotificationPress}
        onNotificationAction={messaging.handleNotificationAction}
        onMarkAllRead={messaging.handleMarkAllNotificationsRead}
        onDelete={messaging.handleDeleteNotification}
        onClearAll={messaging.handleClearReadNotifications}
        isLoading={messaging.notificationsLoading}
      />

      {/* Chats List Modal */}
      <ChatsListModal
        visible={messaging.chatsListVisible}
        onClose={() => messaging.setChatsListVisible(false)}
        conversations={messaging.conversations}
        onConversationPress={messaging.handleConversationPress}
        isLoading={messaging.chatsLoading}
      />

      {/* Chat Details Modal */}
      <ChatDetailsModal
        visible={messaging.chatDetailsVisible}
        onClose={() => messaging.setChatDetailsVisible(false)}
        conversation={messaging.activeConversation}
        messages={messaging.activeMessages}
        onSendMessage={messaging.handleSendDirectMessage}
        onDeleteMessage={messaging.handleDeleteMessage}
        onJoinRoom={messaging.handleJoinRoomFromChat}
        currentUserId={messaging.currentUserId}
        onBack={messaging.handleChatDetailsBack}
      />

      {/* Buy Coins Modal */}
      <BuyCoinsModal
        visible={buyCoinsVisible}
        onClose={() => setBuyCoinsVisible(false)}
        currentCoins={localCoins}
        onPurchase={handleCoinsPurchased}
      />

      {/* Room Search Modal */}
      <RoomSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onRoomSelect={handleSearchRoomSelect}
      />
    </View>
  );
}
