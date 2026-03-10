/**
 * HomeScreen - Main landing page
 * Features: Logo, Join/Host buttons, navigation bars
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Image, BackHandler, Modal as RNModal, Pressable, Animated } from "react-native";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { Text, Button, Icon, Modal } from "@/components/ui";
import { TopNavBar, BottomNavBar } from "@/components/navigation";
import { WaveDivider, CreateOptionsModal, BuyCoinsModal } from "@/components/common";
import { DecoCircle, FloatingBadge } from "@/components/decorative";
import { PackSelectionModal } from "@/components/packs";
import type { PackData } from "@/components/packs/types";
import { FriendsListModal, AddFriendModal, CreateGameDialog } from "@/components/friends";
import { ChatDetailsModal, NotificationsModal, ChatsListModal } from "@/components/messaging";
import { MarketplaceModal } from "@/components/marketplace";
import { useMessaging, useFriends, useAuth, usePacks } from "@/hooks";
import { useToast } from "@/contexts";
import { storeService } from "@/services/storeService";
import { colors, withOpacity } from "@/themes";
import { UI_TIMING } from "@/constants";
import type { RootStackParamList } from "../../App";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

/**
 * Exit Confirmation Modal - Centered modal for exit confirmation
 */
function ExitConfirmationModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <RNModal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center" pointerEvents="box-none">
        {/* Backdrop */}
        <Animated.View
          pointerEvents="auto"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: withOpacity(colors.black, 0.6),
            opacity: opacityAnim,
          }}
        >
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          pointerEvents="auto"
          className="mx-8 rounded-3xl overflow-hidden"
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            backgroundColor: colors.white,
            width: 300,
          }}
        >
          {/* Icon */}
          <View className="items-center pt-6 pb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: withOpacity(colors.error, 0.1) }}
            >
              <Icon name="log-out-outline" size="xl" color={colors.error} />
            </View>
          </View>

          {/* Text */}
          <View className="px-6 pb-6">
            <Text variant="h3" className="font-bold text-center mb-2">
              Exit App?
            </Text>
            <Text variant="body-sm" color="muted" className="text-center">
              Are you sure you want to exit the app?
            </Text>
          </View>

          {/* Actions */}
          <View
            className="flex-row border-t"
            style={{ borderTopColor: colors.neutral[200] }}
          >
            <Pressable
              onPress={onClose}
              delayPressIn={0}
              className="flex-1 py-4 items-center border-r active:bg-neutral-50"
              style={{ borderRightColor: colors.neutral[200] }}
            >
              <Text variant="body" className="font-semibold" style={{ color: colors.neutral[600] }}>
                Stay
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              delayPressIn={0}
              className="flex-1 py-4 items-center active:bg-red-50"
            >
              <Text variant="body" className="font-semibold" style={{ color: colors.error }}>
                Exit
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </RNModal>
  );
}

/**
 * HomeScreen component
 */
export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "Home">>();
  const { user, updateProfile, refreshUser } = useAuth();
  const toast = useToast();
  const [packModalVisible, setPackModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [buyCoinsVisible, setBuyCoinsVisible] = useState(false);
  const [marketplaceVisible, setMarketplaceVisible] = useState(false);
  const [exitDialogVisible, setExitDialogVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [localCoins, setLocalCoins] = useState(user?.coins ?? 0);

  // Handle hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setExitDialogVisible(true);
        return true; // Prevent default back action
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [])
  );

  // Use centralized hooks
  const messaging = useMessaging();
  const friendsHook = useFriends();
  const packsHook = usePacks();

  // Sync local coins with user
  useEffect(() => {
    setLocalCoins(user?.coins ?? 0);
  }, [user?.coins]);

  const handleCoinsPurchased = async (packageId: string) => {
    try {
      const response = await storeService.purchaseCoins(packageId);

      if (response.success && response.data) {
        // Optimistic update
        setLocalCoins(response.data.newBalance);

        // Sync with auth context
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

  const handleCoinsUpdated = (newBalance: number) => {
    setLocalCoins(newBalance);
  };

  // Fetch packs when modal opens
  useEffect(() => {
    if (packModalVisible) {
      packsHook.fetchPacks();
    }
  }, [packModalVisible]);

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

  // Handle openChatWith route param (from UserProfileScreen)
  useEffect(() => {
    const chatWith = route.params?.openChatWith;
    if (chatWith) {
      // Clear the param to prevent re-opening on re-render
      navigation.setParams({ openChatWith: undefined });
      messaging.openDirectChat(chatWith);
    }
  }, [route.params?.openChatWith]);

  const handleTabPress = (tabId: string) => {
    if (tabId === "rooms") {
      navigation.navigate("Rooms");
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

  const handleJoinRoom = () => {
    navigation.navigate("Rooms");
  };

  const handleHostRoom = () => {
    setPackModalVisible(true);
  };

  const handlePackSelected = (pack: PackData) => {
    navigation.navigate("RoomConfig", { pack });
  };

  const handleCreatePack = () => {
    navigation.navigate("PackCreation", {});
  };

  const handleSettingsPress = () => {
    navigation.navigate("Settings");
  };

  return (
    <View className="flex-1 bg-background">
      {/* Top Navigation Bar */}
      <TopNavBar
        coins={localCoins}
        onSettingsPress={handleSettingsPress}
        onHelpPress={() => setHelpVisible(true)}
        onCoinsPress={() => setBuyCoinsVisible(true)}
        onCreatePress={() => setCreateModalVisible(true)}
        onStorePress={() => setMarketplaceVisible(true)}
      />

      {/* Main Content */}
      <View className="flex-1">
        {/* Welcome Image Section with Orange Background */}
        <View
          className="items-center justify-center relative overflow-hidden"
          style={{ backgroundColor: colors.primary[500], paddingVertical: 5 }}
        >
          {/* Decorative Background Circles */}
          <DecoCircle
            size={120}
            position={{ top: -30, left: -40 }}
            opacity={0.08}
          />
          <DecoCircle
            size={80}
            position={{ top: 20, right: -20 }}
            opacity={0.1}
          />
          <DecoCircle
            size={60}
            position={{ bottom: 40, left: 20 }}
            opacity={0.06}
          />
          <DecoCircle
            size={100}
            position={{ bottom: -30, right: 30 }}
            opacity={0.08}
          />

          {/* Title - On top */}
          <View className="items-center mb-4">
            <Text
              style={{
                fontSize: 48,
                fontWeight: "bold",
                fontFamily: "sans-serif-condensed",
                color: colors.white,
                letterSpacing: 4,
                textShadowColor: withOpacity(colors.black, 0.3),
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 2,
                paddingTop: 12,
                paddingBottom: 12,
              }}
            >
              FAHMAN
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: withOpacity(colors.white, 0.8),
                letterSpacing: 4,
                marginTop: 2,
              }}
            >
              PARTY GAME
            </Text>
          </View>

          {/* Main Image */}
          <Image
            source={require("../../assets/home/welcome.png")}
            style={{ width: 330, height: 230 }}
            resizeMode="contain"
          />

          {/* Floating Badges */}
          <FloatingBadge
            icon="people"
            label="Play with Friends"
            position={{ bottom: 10, left: 10 }}
          />
        </View>

        {/* Wave Divider */}
        <WaveDivider height={60} flip />

        {/* Buttons Section */}
        <View className="flex-1 px-8">
          <Text variant="h3" center className="mb-2">
            Ready to Play?
          </Text>
          <Text variant="body" color="secondary" center className="mb-8">
            Join an existing room or host your own game
          </Text>

          {/* Action Buttons */}
          <View className="gap-4">
            <Button variant="primary" size="lg" fullWidth onPress={handleJoinRoom}>
              Join Room
            </Button>

            <Button variant="outline" size="lg" fullWidth onPress={handleHostRoom}>
              Host Room
            </Button>
          </View>
        </View>
      </View>

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        centerTab={{ id: "rooms", label: "Rooms", icon: "game-controller-outline", activeIcon: "game-controller" }}
        activeTab="rooms"
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
        onCreateRoom={handleHostRoom}
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

      {/* Marketplace Modal */}
      <MarketplaceModal
        visible={marketplaceVisible}
        onClose={() => setMarketplaceVisible(false)}
        userCoins={localCoins}
        currentAvatarUrl={user?.avatar}
        userName={user?.displayName || user?.username || "Player"}
        onCoinsUpdated={handleCoinsUpdated}
        onBuyCoins={() => {
          setMarketplaceVisible(false);
          setTimeout(() => setBuyCoinsVisible(true), UI_TIMING.MODAL_TRANSITION_DELAY);
        }}
        onAvatarSelect={async (avatarUrl) => {
          try {
            await updateProfile({ avatar: avatarUrl });
          } catch (error: any) {
            toast.error(error.message || "Failed to update avatar");
          }
        }}
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

      {/* Create Game Dialog (Play with Friend) */}
      <CreateGameDialog
        visible={!!friendsHook.playFriend}
        friend={friendsHook.playFriend}
        onClose={() => friendsHook.setPlayFriend(null)}
      />

      {/* Buy Coins Modal */}
      <BuyCoinsModal
        visible={buyCoinsVisible}
        onClose={() => setBuyCoinsVisible(false)}
        currentCoins={localCoins}
        onPurchase={handleCoinsPurchased}
      />

      {/* Help Modal */}
      <Modal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title="How to Play"
        maxHeight="70%"
      >
        <View className="gap-5">
          {/* Join a Game */}
          <View className="flex-row">
            <View
              className="w-9 h-9 rounded-xl items-center justify-center mr-3 mt-0.5"
              style={{ backgroundColor: withOpacity(colors.primary[500], 0.12) }}
            >
              <Icon name="game-controller" size="sm" color={colors.primary[500]} />
            </View>
            <View className="flex-1">
              <Text variant="body" className="font-semibold mb-1">Join a Room</Text>
              <Text variant="body-sm" color="secondary">
                Tap "Join Room" to browse public rooms or enter a room code to join a private game with friends.
              </Text>
            </View>
          </View>

          {/* Host a Game */}
          <View className="flex-row">
            <View
              className="w-9 h-9 rounded-xl items-center justify-center mr-3 mt-0.5"
              style={{ backgroundColor: withOpacity(colors.success, 0.12) }}
            >
              <Icon name="add-circle" size="sm" color={colors.success} />
            </View>
            <View className="flex-1">
              <Text variant="body" className="font-semibold mb-1">Host a Room</Text>
              <Text variant="body-sm" color="secondary">
                Tap "Host Room", pick a question pack, set your room options (public/private, max players), then share the code.
              </Text>
            </View>
          </View>

          {/* Gameplay */}
          <View className="flex-row">
            <View
              className="w-9 h-9 rounded-xl items-center justify-center mr-3 mt-0.5"
              style={{ backgroundColor: withOpacity(colors.info, 0.12) }}
            >
              <Icon name="help-circle" size="sm" color={colors.info} />
            </View>
            <View className="flex-1">
              <Text variant="body" className="font-semibold mb-1">Answer & Bet</Text>
              <Text variant="body-sm" color="secondary">
                Each round shows a question with multiple choices. Pick your answer, then place a confidence bet. Higher bets = more points if correct, but you lose them if wrong.
              </Text>
            </View>
          </View>

          {/* Create Packs */}
          <View className="flex-row">
            <View
              className="w-9 h-9 rounded-xl items-center justify-center mr-3 mt-0.5"
              style={{ backgroundColor: withOpacity(colors.gold, 0.15) }}
            >
              <Icon name="create" size="sm" color={colors.gold} />
            </View>
            <View className="flex-1">
              <Text variant="body" className="font-semibold mb-1">Create a Pack</Text>
              <Text variant="body-sm" color="secondary">
                Tap the + button in the top bar to create your own question pack. Add questions, set categories, and share it with others.
              </Text>
            </View>
          </View>

          {/* Friends */}
          <View className="flex-row">
            <View
              className="w-9 h-9 rounded-xl items-center justify-center mr-3 mt-0.5"
              style={{ backgroundColor: withOpacity(colors.primary[500], 0.12) }}
            >
              <Icon name="people" size="sm" color={colors.primary[500]} />
            </View>
            <View className="flex-1">
              <Text variant="body" className="font-semibold mb-1">Add Friends</Text>
              <Text variant="body-sm" color="secondary">
                Use the Friends tab to add players by Game ID. Chat, invite them to rooms, or challenge them directly.
              </Text>
            </View>
          </View>

          {/* Coins */}
          <View className="flex-row">
            <View
              className="w-9 h-9 rounded-xl items-center justify-center mr-3 mt-0.5"
              style={{ backgroundColor: withOpacity(colors.gold, 0.15) }}
            >
              <Icon name="diamond" size="sm" color={colors.gold} />
            </View>
            <View className="flex-1">
              <Text variant="body" className="font-semibold mb-1">Earn Coins</Text>
              <Text variant="body-sm" color="secondary">
                Win games to earn coins. Use coins in the Store to unlock avatars and other items.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Exit Confirmation Modal */}
      <ExitConfirmationModal
        visible={exitDialogVisible}
        onClose={() => setExitDialogVisible(false)}
        onConfirm={() => {
          setExitDialogVisible(false);
          // Small delay to ensure state is cleared before app exits
          setTimeout(() => BackHandler.exitApp(), 100);
        }}
      />
    </View>
  );
}
