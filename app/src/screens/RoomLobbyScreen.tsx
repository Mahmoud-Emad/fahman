/**
 * RoomLobbyScreen - Pre-game lobby for waiting and inviting players
 * Features: Room info, player list, chat, share room, start game (host)
 */
import React from "react";
import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Button } from "@/components/ui";
import {
  ShareRoomModal,
  UserSelectModal,
  PlayersModal,
  LobbyChatModal,
  LobbyHeader,
  LobbyDMFab,
} from "@/components/lobby";
import { LeaveConfirmDialog } from "@/components/common";
import { colors, withOpacity } from "@/themes";
import { useMessaging } from "@/contexts";
import { useRoomLobby } from "./useRoomLobby";
import { LobbyPlayerSection } from "./LobbyPlayerSection";
import { LobbyChat } from "./LobbyChat";

export function RoomLobbyScreen() {
  const insets = useSafeAreaInsets();
  const messaging = useMessaging();
  const lobby = useRoomLobby();

  return (
    <View className="flex-1 bg-surface-secondary">
      <LobbyHeader
        roomTitle={lobby.roomTitle}
        roomDescription={lobby.roomDescription}
        roomCode={lobby.roomCode}
        playerCount={lobby.players.length}
        maxPlayers={lobby.maxPlayers}
        packTitle={lobby.packTitle}
        packDescription={lobby.packDescription}
        packImageUrl={lobby.packImageUrl}
        packQuestionsCount={lobby.packQuestionsCount}
        packCategory={lobby.packCategory}
        onBack={() => lobby.setShowLeaveDialog(true)}
        onShare={() => lobby.setShareModalVisible(true)}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <LobbyPlayerSection
          playerCount={lobby.players.length}
          minPlayers={lobby.minPlayersToStart}
          canStart={lobby.canStart}
          avatarGroupData={lobby.avatarGroupData}
          onPlayersPress={() => lobby.setPlayersModalVisible(true)}
          onInvitePress={() => lobby.setShareModalVisible(true)}
        />

        <LobbyChat
          unreadCount={lobby.unreadChatCount}
          lastMessagePreview={lobby.lastMessagePreview}
          onPress={lobby.handleOpenChat}
        />
      </ScrollView>

      {/* Bottom Action */}
      <View
        className="px-4 pt-4 bg-surface border-t"
        style={{ borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }}
      >
        {lobby.isHost ? (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={lobby.isStarting}
            disabled={lobby.isStarting || !lobby.canStart}
            onPress={lobby.handleStartGame}
          >
            {lobby.canStart
              ? "Start Game"
              : `Waiting for players (${lobby.players.length}/${lobby.minPlayersToStart})`}
          </Button>
        ) : (
          <View
            className="flex-row items-center justify-center p-4 rounded-xl"
            style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
          >
            <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: colors.primary[500] }} />
            <Text variant="body" className="font-medium" style={{ color: colors.primary[500] }}>
              Waiting for host to start the game...
            </Text>
          </View>
        )}
      </View>

      {/* Modals */}
      <PlayersModal
        visible={lobby.playersModalVisible}
        onClose={() => lobby.setPlayersModalVisible(false)}
        players={lobby.players}
        currentUserId={lobby.currentUserId}
        hostId={lobby.hostId}
        onPlayerAction={lobby.handlePlayerAction}
        onInvite={lobby.handleInviteFromPlayersModal}
      />

      <LobbyChatModal
        visible={lobby.chatModalVisible}
        onClose={() => lobby.setChatModalVisible(false)}
        messages={lobby.messages}
        currentUserId={lobby.currentUserId}
        onSendMessage={lobby.handleSendMessage}
      />

      <ShareRoomModal
        visible={lobby.shareModalVisible}
        onClose={() => lobby.setShareModalVisible(false)}
        onInAppShare={lobby.handleInAppShare}
        roomCode={lobby.roomCode}
        packName={lobby.packTitle}
        password={lobby.config.isPasswordProtected ? lobby.config.password : undefined}
      />

      <UserSelectModal
        visible={lobby.userSelectVisible}
        onClose={() => lobby.setUserSelectVisible(false)}
        onSendInvites={lobby.handleSendInvites}
        users={lobby.inviteUsers}
        roomCode={lobby.roomCode}
        packName={lobby.packTitle}
        isLoading={lobby.inviteUsersLoading}
      />

      <LeaveConfirmDialog
        visible={lobby.showLeaveDialog}
        onClose={() => lobby.setShowLeaveDialog(false)}
        onConfirm={lobby.handleLeaveRoom}
        {...(lobby.isHost && lobby.players.length > 1 && {
          title: "End Room for All?",
          message: "Ending the room will remove all players and close the room. This cannot be undone.",
        })}
      />

      <LeaveConfirmDialog
        visible={!!lobby.removeFriendTarget}
        onClose={() => lobby.setRemoveFriendTarget(null)}
        onConfirm={lobby.confirmRemoveFriend}
        title="Remove Friend?"
        message={`Are you sure you want to remove ${lobby.removeFriendTarget?.playerName ?? "this player"} from your friends?`}
        confirmLabel="Remove"
        icon="person-remove"
      />

      <LobbyDMFab
        conversations={messaging.conversations}
        unreadCount={messaging.unreadMessageCount}
        isLoading={messaging.chatsLoading}
        onConversationPress={messaging.handleConversationPress}
        activeConversation={messaging.activeConversation}
        activeMessages={messaging.activeMessages}
        onSendMessage={messaging.handleSendDirectMessage}
        onDeleteMessage={messaging.handleDeleteMessage}
        onJoinRoom={messaging.handleJoinRoomFromChat}
        currentUserId={messaging.currentUserId}
        onBack={() => messaging.setChatDetailsVisible(false)}
        chatActive={messaging.chatDetailsVisible}
        bottomOffset={80}
      />
    </View>
  );
}
