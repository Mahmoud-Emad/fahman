/**
 * RoomDetailsScreen - Game room with questions and answers
 * Features: Multiple-choice questions, confidence betting, timer (server-driven),
 *           auto-graded results, host-controlled progression, final scoreboard
 */
import React, { useEffect, useRef } from "react";
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { BottomNavBar } from "@/components/navigation";
import { LeaveConfirmDialog } from "@/components/common";
import {
  GameHeader,
  AnsweringPhase,
  LobbyPhase,
  WaitingPhase,
  ResultsPhase,
  SubmitButton,
  WaitingIndicator,
  useGameState,
  useGameHandlers,
  useGameSocket,
} from "@/components/game";
import {
  NotificationsModal,
  ChatsListModal,
  ChatDetailsModal,
} from "@/components/messaging";
import { FriendsListModal, AddFriendModal, CreateGameDialog } from "@/components/friends";
import { useMessaging, useRoomPresence } from "@/hooks";
import { useToast, useFriendsContext } from "@/contexts";
import { roomsService } from "@/services/roomsService";
import type { RoomMemberInfo } from "@/services/socketService";
import type { RootStackParamList } from "../../App";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

type RoomDetailsRouteProp = RouteProp<RootStackParamList, "RoomDetails">;
type RoomDetailsNavigationProp = StackNavigationProp<RootStackParamList, "RoomDetails">;

/**
 * RoomDetailsScreen component — connects socket events to game UI
 */
export function RoomDetailsScreen() {
  const route = useRoute<RoomDetailsRouteProp>();
  const navigation = useNavigation<RoomDetailsNavigationProp>();
  const toast = useToast();
  const { roomId, isHost: routeIsHost } = route.params;

  // Guard against double navigation on leave/close/kick
  const hasLeftRoom = useRef(false);

  // Use centralized hooks
  const messaging = useMessaging();
  const friendsHook = useFriendsContext();

  // Game state management
  const gameState = useGameState({
    isHost: routeIsHost ?? false,
    onBackPress: () => gameState.setShowLeaveDialog(true),
  });

  // Room presence — join socket room and track players in real-time
  useRoomPresence({
    roomId,
    enabled: !!roomId,
    onRoomJoined: (members: RoomMemberInfo[]) => {
      gameState.setPlayers(
        members.map((m) => ({
          id: m.id,
          name: m.displayName || m.username,
          initials: getInitials(m.displayName || m.username),
          avatar: m.avatar || undefined,
          score: m.score,
          hasAnswered: false,
        }))
      );
      gameState.setTotalPlayers(members.length);
    },
    onPlayerJoined: (player: RoomMemberInfo) => {
      gameState.setPlayers((prev) => {
        if (prev.some((p) => p.id === player.id)) return prev;
        return [
          ...prev,
          {
            id: player.id,
            name: player.displayName || player.username,
            initials: getInitials(player.displayName || player.username),
            avatar: player.avatar || undefined,
            score: player.score,
            hasAnswered: false,
          },
        ];
      });
      gameState.setTotalPlayers((prev) => prev + 1);
    },
    onPlayerLeft: (playerId: string) => {
      gameState.setPlayers((prev) => prev.filter((p) => p.id !== playerId));
      gameState.setTotalPlayers((prev) => Math.max(0, prev - 1));
    },
    onRoomClosed: (reason: string) => {
      if (hasLeftRoom.current) return;
      hasLeftRoom.current = true;
      toast.error(`Room closed: ${reason}`);
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    },
    onKicked: (reason: string) => {
      if (hasLeftRoom.current) return;
      hasLeftRoom.current = true;
      toast.error(`You were kicked: ${reason}`);
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    },
  });

  // REST API fallback — fetch initial room members (guarantees data even if socket is slow)
  useEffect(() => {
    if (!roomId) return;

    roomsService.getRoom(roomId).then((res) => {
      if (res.success && res.data?.members) {
        gameState.setPlayers((prev) => {
          // Only populate if players list is still empty (socket hasn't delivered yet)
          if (prev.length > 0) return prev;
          return res.data!.members!.map((m) => ({
            id: m.user.id,
            name: m.user.displayName || m.user.username,
            initials: getInitials(m.user.displayName || m.user.username),
            avatar: m.user.avatar || undefined,
            score: m.score,
            hasAnswered: false,
          }));
        });
        gameState.setTotalPlayers((prev) => {
          if (prev > 0) return prev;
          return res.data!.members!.length;
        });
      }
    }).catch(() => {});
  }, [roomId]);

  // Socket-to-state bridge — subscribes to all game events
  useGameSocket({
    roomId,
    currentUserId: gameState.currentUserId,
    setGamePhase: gameState.setGamePhase,
    setTotalQuestions: gameState.setTotalQuestions,
    setCurrentQuestion: gameState.setCurrentQuestion,
    setQuestionText: gameState.setQuestionText,
    setQuestionId: gameState.setQuestionId,
    setOptions: gameState.setOptions,
    setQuestionType: gameState.setQuestionType,
    setTimeLeft: gameState.setTimeLeft,
    setSelectedAnswer: gameState.setSelectedAnswer,
    setSelectedBet: gameState.setSelectedBet,
    setHasSubmitted: gameState.setHasSubmitted,
    setCorrectAnswer: gameState.setCorrectAnswer,
    setQuestionResults: gameState.setQuestionResults,
    setPlayersAnswered: gameState.setPlayersAnswered,
    setTotalPlayers: gameState.setTotalPlayers,
    setPlayerScore: gameState.setPlayerScore,
    setPlayers: gameState.setPlayers,
    setWinner: gameState.setWinner,
    setFinalScores: gameState.setFinalScores,
    setMessages: gameState.setMessages,
    setTextHint: gameState.setTextHint,
  });

  // REST fallback — if still in "waiting" phase after 3s, fetch game state from API
  // Handles race condition where game:question socket event fires before listeners are ready
  const gamePhaseRef = useRef(gameState.gamePhase);
  gamePhaseRef.current = gameState.gamePhase;

  useEffect(() => {
    if (!roomId) return;

    const timer = setTimeout(() => {
      if (gamePhaseRef.current !== "waiting") return;

      roomsService.getGameState(roomId).then((res) => {
        if (!res.success || !res.data) return;
        const { currentQuestion, totalQuestions, currentQuestionIndex, status } = res.data;

        if (status === "PLAYING" && currentQuestion) {
          gameState.setCurrentQuestion(currentQuestionIndex + 1);
          gameState.setTotalQuestions(totalQuestions);
          gameState.setQuestionText(currentQuestion.text);
          gameState.setQuestionId(currentQuestion.id);
          gameState.setOptions(currentQuestion.options as string[]);
          gameState.setQuestionType(currentQuestion.questionType);
          gameState.setTimeLeft(currentQuestion.timeLimit);
          gameState.setGamePhase("answering");
        }
      }).catch(() => {});
    }, 3000);

    return () => clearTimeout(timer);
  }, [roomId]);

  // Game action handlers — wired to socket emissions
  const handlers = useGameHandlers({
    roomId,
    selectedAnswer: gameState.selectedAnswer,
    selectedBet: gameState.selectedBet,
    hasSubmitted: gameState.hasSubmitted,
    timeLeft: gameState.timeLeft,
    roomSettings: gameState.roomSettings,
    currentUserId: gameState.currentUserId,
    setHasSubmitted: gameState.setHasSubmitted,
    setShowLeaveDialog: gameState.setShowLeaveDialog,
    setUsedBets: gameState.setUsedBets,
    setPlayers: gameState.setPlayers,
    setMessages: gameState.setMessages,
    hasLeftRoom,
    onOpenNotifications: messaging.openNotifications,
    onOpenChatsList: messaging.openChatsList,
    onOpenFriendsList: friendsHook.openFriendsList,
  });

  // Intercept hardware back button and swipe gesture to show leave dialog
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // Block GO_BACK (hardware back button)
      // Allow RESET, REPLACE, NAVIGATE (programmatic navigation)
      if (e.data.action.type !== "GO_BACK") return;
      e.preventDefault();
      gameState.setShowLeaveDialog(true);
    });
    return unsubscribe;
  }, [navigation]);

  const { gamePhase, hasSubmitted, isHost, selectedAnswer, selectedBet } = gameState;
  const canSubmit = selectedAnswer.trim().length > 0 && selectedBet !== null && !hasSubmitted;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <GameHeader
        currentQuestion={gameState.currentQuestion}
        totalQuestions={gameState.totalQuestions}
        playerScore={gameState.playerScore}
        onBackPress={() => gameState.setShowLeaveDialog(true)}
      />

      {/* Main content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Answering Phase */}
        {gamePhase === "answering" && (
          <AnsweringPhase
            timeLeft={gameState.timeLeft}
            questionText={gameState.questionText}
            answerText={gameState.selectedAnswer}
            onChangeAnswer={gameState.setSelectedAnswer}
            hasSubmitted={hasSubmitted}
            selectedBet={gameState.selectedBet}
            onBetSelect={gameState.setSelectedBet}
            betCards={gameState.betCards}
            usedBets={gameState.usedBets}
            playersAnsweredCount={gameState.playersAnswered.length}
            totalPlayers={gameState.totalPlayers}
            textHint={gameState.textHint}
          />
        )}

        {/* Lobby Phase — auto-graded results */}
        {gamePhase === "lobby" && (
          <LobbyPhase
            currentQuestion={gameState.currentQuestion}
            totalQuestions={gameState.totalQuestions}
            questionText={gameState.questionText}
            questionResults={gameState.questionResults}
            isHost={isHost}
            onNextQuestion={handlers.handleNextQuestion}
            currentUserId={gameState.currentUserId}
          />
        )}

        {/* Waiting Phase — loading screen before first question */}
        {gamePhase === "waiting" && <WaitingPhase />}

        {/* Results Phase */}
        {gamePhase === "results" && (
          <ResultsPhase players={gameState.players} />
        )}
      </ScrollView>

      {/* Bottom Action Button - Submit */}
      {gamePhase === "answering" && !hasSubmitted && (
        <SubmitButton
          isEnabled={canSubmit}
          onSubmit={handlers.handleSubmitAnswer}
        />
      )}

      {/* Waiting for host indicator */}
      {gamePhase === "lobby" && !isHost && <WaitingIndicator />}

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        centerTab={{ id: "rooms", label: "Rooms", icon: "game-controller-outline", activeIcon: "game-controller" }}
        activeTab=""
        onTabPress={handlers.handleBottomTabPress}
        badges={{
          notifications: messaging.unreadNotificationCount,
          chats: messaging.unreadMessageCount,
        }}
      />

      {/* Leave Confirmation Dialog */}
      <LeaveConfirmDialog
        visible={gameState.showLeaveDialog}
        onClose={() => gameState.setShowLeaveDialog(false)}
        onConfirm={handlers.handleLeaveRoom}
        {...(isHost && gameState.players.length > 1 && {
          title: "End Room for All?",
          message: "Ending the room will remove all players and close the room. This cannot be undone.",
        })}
      />

      {/* Remove Friend Confirmation Dialog */}
      <LeaveConfirmDialog
        visible={handlers.removeFriendConfirm.visible}
        onClose={handlers.cancelRemoveFriend}
        onConfirm={handlers.confirmRemoveFriend}
        title="Remove Friend?"
        message="Are you sure you want to remove this player from your friends?"
        confirmLabel="Remove"
        icon="person-remove"
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
    </KeyboardAvoidingView>
  );
}
