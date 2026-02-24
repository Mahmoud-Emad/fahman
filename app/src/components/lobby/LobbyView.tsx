/**
 * LobbyView - Main lobby view with podium and chat
 */
import React, { useState, useRef, useEffect } from "react";
import { View, Pressable, TextInput, ScrollView, type ScrollView as ScrollViewType } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors } from "@/themes";
import type { Player, ChatMessage } from "./types";
import { PodiumView } from "./PodiumView";
import { PlayersModal } from "./PlayersModal";
import { PlayerActionDialog } from "./PlayerActionDialog";
import { ChatBubble } from "./ChatBubble";

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
  const [chatInput, setChatInput] = useState("");
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

  const handleSend = () => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput("");
  };

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
                <View className="items-center justify-center py-4">
                  <Icon name="chatbubble-outline" size="lg" color={colors.neutral[300]} />
                  <Text variant="caption" color="muted" className="mt-1">
                    No messages yet
                  </Text>
                </View>
              ) : (
                messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === currentUserId}
                  />
                ))
              )}
            </ScrollView>
          </View>

          {/* Chat Input */}
          <View className="flex-row items-center gap-2">
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Type a message..."
              placeholderTextColor={colors.neutral[400]}
              className="flex-1 rounded-xl px-4 py-2.5"
              style={{
                backgroundColor: colors.neutral[100],
                fontSize: 14,
                color: colors.text.primary,
              }}
            />
            <Pressable
              onPress={handleSend}
              disabled={!chatInput.trim()}
              className="w-10 h-10 rounded-full items-center justify-center active:scale-95"
              style={{
                backgroundColor: chatInput.trim() ? colors.primary[500] : colors.neutral[200],
              }}
            >
              <Icon
                name="chevron-forward"
                customSize={18}
                color={chatInput.trim() ? colors.white : colors.neutral[400]}
              />
            </Pressable>
          </View>
        </View>
      )}

      {/* Players Modal */}
      <PlayersModal
        visible={showAllPlayers}
        onClose={() => setShowAllPlayers(false)}
        players={sortedPlayers}
        onPlayerAction={onPlayerAction}
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
