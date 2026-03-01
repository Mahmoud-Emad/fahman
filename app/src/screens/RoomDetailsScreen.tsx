/**
 * RoomDetailsScreen - Game room with questions and answers
 * Features: Multiple-choice questions, confidence betting, timer (server-driven),
 *           auto-graded results, host-controlled progression, final scoreboard
 */
import React from "react";
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { BottomNavBar, LOBBY_TABS } from "@/components/navigation";
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
import { useMessaging } from "@/hooks";
import type { RootStackParamList } from "../../App";

type RoomDetailsRouteProp = RouteProp<RootStackParamList, "RoomDetails">;

/**
 * RoomDetailsScreen component — connects socket events to game UI
 */
export function RoomDetailsScreen() {
  const route = useRoute<RoomDetailsRouteProp>();
  const { roomId, isHost: routeIsHost } = route.params;

  // Use centralized messaging hook
  const messaging = useMessaging();

  // Game state management
  const gameState = useGameState({
    isHost: routeIsHost ?? false,
    onBackPress: () => gameState.setShowLeaveDialog(true),
  });

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
  });

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
    onOpenNotifications: messaging.openNotifications,
    onOpenChatsList: messaging.openChatsList,
  });

  const { gamePhase, hasSubmitted, isHost, selectedAnswer, selectedBet } = gameState;
  const canSubmit = selectedAnswer !== null && selectedBet !== null && !hasSubmitted;

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
            options={gameState.options}
            selectedAnswer={gameState.selectedAnswer}
            onSelectOption={gameState.setSelectedAnswer}
            hasSubmitted={hasSubmitted}
            selectedBet={gameState.selectedBet}
            onBetSelect={gameState.setSelectedBet}
            betCards={gameState.betCards}
            usedBets={gameState.usedBets}
            playersAnsweredCount={gameState.playersAnswered.length}
            totalPlayers={gameState.totalPlayers}
          />
        )}

        {/* Lobby Phase — auto-graded results */}
        {gamePhase === "lobby" && (
          <LobbyPhase
            currentQuestion={gameState.currentQuestion}
            totalQuestions={gameState.totalQuestions}
            questionText={gameState.questionText}
            options={gameState.options}
            correctAnswer={gameState.correctAnswer}
            questionResults={gameState.questionResults}
            isHost={isHost}
            onNextQuestion={handlers.handleNextQuestion}
            currentUserId={gameState.currentUserId}
          />
        )}

        {/* Waiting Phase */}
        {gamePhase === "waiting" && (
          <WaitingPhase
            players={gameState.players}
            messages={gameState.messages}
            currentUserId={gameState.currentUserId}
            onSendMessage={handlers.handleSendMessage}
            onPlayerAction={handlers.handlePlayerAction}
          />
        )}

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
        tabs={LOBBY_TABS}
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
    </KeyboardAvoidingView>
  );
}
