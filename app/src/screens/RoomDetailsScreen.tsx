/**
 * RoomDetailsScreen - Game room with questions and answers
 * Features: Question display, answer input, confidence betting, timer, lobby, chat
 */
import React from "react";
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";
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
} from "@/components/game";
import {
  NotificationsModal,
  ChatsListModal,
  ChatDetailsModal,
} from "@/components/messaging";
import { useMessaging } from "@/hooks";

/**
 * RoomDetailsScreen component
 */
export function RoomDetailsScreen() {
  // Use centralized messaging hook
  const messaging = useMessaging();

  // Game state management
  const gameState = useGameState({
    onBackPress: () => gameState.setShowLeaveDialog(true),
  });

  // Game action handlers
  const handlers = useGameHandlers({
    // State values
    answer: gameState.answer,
    selectedBet: gameState.selectedBet,
    hasSubmitted: gameState.hasSubmitted,
    currentQuestion: gameState.currentQuestion,
    totalQuestions: gameState.totalQuestions,
    roomSettings: gameState.roomSettings,
    currentUserId: gameState.currentUserId,

    // State setters
    setHasSubmitted: gameState.setHasSubmitted,
    setGamePhase: gameState.setGamePhase,
    setPlayers: gameState.setPlayers,
    setMessages: gameState.setMessages,
    setShowLeaveDialog: gameState.setShowLeaveDialog,
    setUsedBets: gameState.setUsedBets,
    setCurrentQuestion: gameState.setCurrentQuestion,
    setQuestionText: gameState.setQuestionText,
    setTimeLeft: gameState.setTimeLeft,
    setIsTimerActive: gameState.setIsTimerActive,
    setAnswer: gameState.setAnswer,
    setSelectedBet: gameState.setSelectedBet,

    // Messaging callbacks
    onOpenNotifications: messaging.openNotifications,
    onOpenChatsList: messaging.openChatsList,
  });

  const { gamePhase, hasSubmitted, isHost, answer, selectedBet } = gameState;
  const canSubmit = answer.trim() !== "" && selectedBet !== null;

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
        {gamePhase === "answering" && !hasSubmitted && (
          <AnsweringPhase
            timeLeft={gameState.timeLeft}
            questionText={gameState.questionText}
            answer={gameState.answer}
            onAnswerChange={gameState.setAnswer}
            selectedBet={gameState.selectedBet}
            onBetSelect={gameState.setSelectedBet}
            betCards={gameState.betCards}
            usedBets={gameState.usedBets}
          />
        )}

        {/* Lobby Phase */}
        {gamePhase === "lobby" && (
          <LobbyPhase
            currentQuestion={gameState.currentQuestion}
            totalQuestions={gameState.totalQuestions}
            questionText={gameState.questionText}
            hasSubmitted={hasSubmitted}
            answer={gameState.answer}
            selectedBet={gameState.selectedBet}
            isHost={isHost}
            players={gameState.players}
            messages={gameState.messages}
            currentUserId={gameState.currentUserId}
            onSendMessage={handlers.handleSendMessage}
            onPlayerAction={handlers.handlePlayerAction}
            onMarkPlayer={handlers.handleMarkPlayer}
            onNextQuestion={handlers.handleNextQuestion}
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
