/**
 * RoomsScreen - Display list of rooms created by users
 * Features: Smart event section with dynamic colors, carousel, user info, search
 */
import React, { useState, useEffect } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { BottomNavBar, ROOM_LIST_TABS } from "@/components/navigation";
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
import {
  NotificationsModal,
  ChatsListModal,
  ChatDetailsModal,
} from "@/components/messaging";
import { BuyCoinsModal } from "@/components/common";
import { useMessaging, useAuth, usePacks } from "@/hooks";
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
  const [buyCoinsVisible, setBuyCoinsVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [localCoins, setLocalCoins] = useState(user?.coins ?? 0);

  // Use centralized hooks
  const messaging = useMessaging();
  const packsHook = usePacks();

  // Sync local coins with user
  useEffect(() => {
    setLocalCoins(user?.coins ?? 0);
  }, [user?.coins]);

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
  } = useRoomData();

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
    if (tabId === "home") {
      navigation.goBack();
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
        tabs={ROOM_LIST_TABS}
        activeTab="rooms"
        onTabPress={handleTabPress}
        badges={{
          notifications: messaging.unreadNotificationCount,
          chats: messaging.unreadMessageCount,
        }}
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
