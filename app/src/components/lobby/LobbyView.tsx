/**
 * LobbyView - Main lobby view with podium and chat
 */
import React, { useState, useRef, useEffect } from "react";
import { View, Pressable, ScrollView, type ScrollView as ScrollViewType } from "react-native";
import { Text, Icon, EmptyState } from "@/components/ui";
import { MessageInput } from "@/components/messaging/MessageInput";
import { colors } from "@/themes";
import type { Player, ChatMessage } from "./types";
import { PodiumView } from "./PodiumView";
import { PlayersModal } from "@/components/lists";
import { PlayerActionDialog } from "./PlayerActionDialog";
import { ChatBubble } from "@/components/chat";

interface LobbyViewProps {
  players: Player[];
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  currentUserId: string;
  showChat: boolean;
  onPlayerAction: (action: string, playerId: string) => void;
}

/**
 * Lobby view with podium and chat - compact layout
 */
export function LobbyView({
  players,
  messages,
  onSendMessage,
  currentUserId,
  showChat,
  onPlayerAction,
}: LobbyViewProps) {
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const chatScrollRef = useRef<ScrollViewType>(null);

  // Auto-scroll to end when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && chatScrollRef.current) {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Sort players by score and get top 3
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const topPlayers = sortedPlayers.slice(0, 3);
  const remainingCount = Math.max(0, players.length - 3);

  const handlePlayerPress = (player: Player) => {
    setSelectedPlayer(player);
  };

  const handleAction = (action: string, playerId: string) => {
    onPlayerAction(action, playerId);
    setSelectedPlayer(null);
  };

  return (
    <View className="flex-1">
      {/* Podium Section */}
      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text variant="body" className="font-semibold">
            Leaderboard
          </Text>
          {remainingCount > 0 && (
            <Pressable
              onPress={() => setShowAllPlayers(true)}
              className="flex-row items-center active:opacity-70"
            >
              <Text
                variant="caption"
                className="font-medium"
                style={{ color: colors.primary[500] }}
              >
                +{remainingCount} more
              </Text>
              <Icon name="chevron-forward" customSize={14} color={colors.primary[500]} />
            </Pressable>
          )}
        </View>

        <PodiumView players={topPlayers} onPlayerPress={handlePlayerPress} />
      </View>

      {/* Chat Section */}
      {showChat && (
        <View className="flex-1">
          <Text variant="body" className="font-semibold mb-2">
            Chat
          </Text>
          <View
            className="rounded-xl mb-2"
            style={{
              backgroundColor: colors.neutral[50],
              borderWidth: 1,
              borderColor: colors.neutral[200],
              height: 180,
              minHeight: 250,
            }}
          >
            <ScrollView
              ref={chatScrollRef}
              className="p-2"
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              onContentSizeChange={() => {
                chatScrollRef.current?.scrollToEnd({ animated: true });
              }}
            >
              {messages.length === 0 ? (
                <EmptyState
                  icon="chatbubble-outline"
                  title="No messages yet"
                  className="py-4"
                />
              ) : (
                messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    isCurrentUser={message.senderId === currentUserId}
                    type={message.type === "system" ? "system" : "text"}
                    text={message.message}
                    senderName={message.senderName}
                    senderInitials={message.senderInitials}
                    senderAvatar={message.senderAvatar}
                    timestamp={message.timestamp}
                    systemVariant={message.systemVariant}
                    showAvatar
                    showSenderName
                    variant="room"
                  />
                ))
              )}
            </ScrollView>
          </View>

          {/* Chat Input */}
          <MessageInput onSend={onSendMessage} />
        </View>
      )}

      {/* Players Modal */}
      <PlayersModal
        visible={showAllPlayers}
        onClose={() => setShowAllPlayers(false)}
        players={sortedPlayers}
        currentUserId={currentUserId}
        hostId=""
        onPlayerAction={onPlayerAction}
        onInvite={() => {}}
      />

      {/* Player Action Dialog */}
      <PlayerActionDialog
        player={selectedPlayer}
        visible={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        onAction={handleAction}
      />
    </View>
  );
}
