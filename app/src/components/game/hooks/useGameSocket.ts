/**
 * useGameSocket - Socket-to-state bridge for game events
 * Subscribes to all server game events and maps them to local state updates.
 */
import { useEffect } from "react";
import {
  socketService,
  type GameStartedData,
  type QuestionData,
  type QuestionResultsData,
  type GameFinishedData,
  type PlayerScore,
  type ChatMessage as SocketChatMessage,
} from "@/services/socketService";
import type { GamePhase, PlayerResult, ChatMessage } from "../types";
import type { Player } from "@/components/lobby/types";

interface UseGameSocketOptions {
  roomId: string;
  currentUserId: string;

  // State setters
  setGamePhase: (phase: GamePhase) => void;
  setTotalQuestions: (total: number) => void;
  setCurrentQuestion: (question: number) => void;
  setQuestionText: (text: string) => void;
  setQuestionId: (id: string) => void;
  setOptions: (options: string[]) => void;
  setQuestionType: (type: string) => void;
  setTimeLeft: (time: number) => void;
  setSelectedAnswer: (answer: string) => void;
  setSelectedBet: (bet: number | null) => void;
  setHasSubmitted: (submitted: boolean) => void;
  setCorrectAnswer: (answer: number[] | null) => void;
  setQuestionResults: (results: PlayerResult[] | null) => void;
  setPlayersAnswered: (updater: (prev: string[]) => string[]) => void;
  setTotalPlayers: (total: number) => void;
  setPlayerScore: (score: number) => void;
  setPlayers: (updater: (prev: Player[]) => Player[]) => void;
  setWinner: (winner: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    score: number;
  } | null) => void;
  setFinalScores: (scores: {
    playerId: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    score: number;
    rank: number;
  }[]) => void;
  setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  setTextHint: (hint: string | null) => void;
}

/**
 * Hook that subscribes to all game socket events and updates state accordingly.
 * Cleans up all subscriptions on unmount.
 */
export function useGameSocket({
  roomId,
  currentUserId,
  setGamePhase,
  setTotalQuestions,
  setCurrentQuestion,
  setQuestionText,
  setQuestionId,
  setOptions,
  setQuestionType,
  setTimeLeft,
  setSelectedAnswer,
  setSelectedBet,
  setHasSubmitted,
  setCorrectAnswer,
  setQuestionResults,
  setPlayersAnswered,
  setTotalPlayers,
  setPlayerScore,
  setPlayers,
  setWinner,
  setFinalScores,
  setMessages,
  setTextHint,
}: UseGameSocketOptions) {
  useEffect(() => {
    if (!roomId) return;

    // game:started — game has begun, store metadata
    const unsubStarted = socketService.onGameStarted((data: GameStartedData) => {
      if (data.roomId !== roomId) return;
      setTotalQuestions(data.totalQuestions);
      setTextHint(data.textHint || null);
      setGamePhase("waiting");
    });

    // game:question — new question arrived
    const unsubQuestion = socketService.onQuestion((data: QuestionData) => {
      if (data.roomId !== roomId) return;
      setCurrentQuestion(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setQuestionText(data.question.text);
      setQuestionId(data.question.id);
      setOptions(data.question.options);
      setQuestionType(data.question.questionType);
      setTimeLeft(data.question.timeLimit);

      // Reset per-question state
      setSelectedAnswer("");
      setSelectedBet(null);
      setHasSubmitted(false);
      setCorrectAnswer(null);
      setQuestionResults(null);
      setPlayersAnswered(() => []);

      setGamePhase("answering");
    });

    // game:timerTick — server timer update
    const unsubTimer = socketService.onTimerTick((data) => {
      if (data.roomId !== roomId) return;
      setTimeLeft(data.timeLeft);
    });

    // game:playerAnswered — another player submitted their answer
    const unsubPlayerAnswered = socketService.onPlayerAnswered((data) => {
      if (data.roomId !== roomId) return;
      setPlayersAnswered((prev) => {
        if (prev.includes(data.playerId)) return prev;
        return [...prev, data.playerId];
      });
    });

    // game:questionResults — server auto-graded results for the question
    const unsubResults = socketService.onQuestionResults((data: QuestionResultsData) => {
      if (data.roomId !== roomId) return;
      setCorrectAnswer(data.correctAnswer);
      setQuestionResults(data.playerResults);

      // Update current player's score from results
      const myResult = data.playerResults.find((r) => r.playerId === currentUserId);
      if (myResult) {
        setPlayerScore(myResult.newScore);
      }

      // Update players list with new scores
      setPlayers((prev) =>
        prev.map((p) => {
          const result = data.playerResults.find((r) => r.playerId === p.id);
          if (result) {
            return { ...p, score: result.newScore, isCorrect: result.isCorrect, hasAnswered: true };
          }
          return p;
        })
      );

      setGamePhase("lobby");
    });

    // game:scoreUpdate — cumulative score update
    const unsubScores = socketService.onScoreUpdate((data) => {
      if (data.roomId !== roomId) return;
      setTotalPlayers(data.scores.length);

      // Update current player score
      const myScore = data.scores.find((s: PlayerScore) => s.playerId === currentUserId);
      if (myScore) {
        setPlayerScore(myScore.score);
      }

      // Update players list
      setPlayers((prev) =>
        prev.map((p) => {
          const scoreEntry = data.scores.find((s: PlayerScore) => s.playerId === p.id);
          if (scoreEntry) {
            return { ...p, score: scoreEntry.score };
          }
          return p;
        })
      );
    });

    // game:finished — game is over
    const unsubFinished = socketService.onGameFinished((data: GameFinishedData) => {
      if (data.roomId !== roomId) return;
      setWinner(data.winner);
      setFinalScores(data.finalScores);

      // Update players list with final scores
      setPlayers((prev) =>
        prev.map((p) => {
          const scoreEntry = data.finalScores.find((s) => s.playerId === p.id);
          if (scoreEntry) {
            return { ...p, score: scoreEntry.score };
          }
          return p;
        })
      );

      setGamePhase("results");
    });

    // chat:message — incoming chat message from other players
    const unsubChat = socketService.onChatMessage((data: SocketChatMessage) => {
      if (data.roomId !== roomId) return;
      // Skip own messages (already added locally by handleSendMessage)
      if (data.senderId === currentUserId) return;

      const senderName = data.senderName || "Unknown";
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          senderId: data.senderId,
          senderName,
          senderInitials: senderName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
          message: data.text,
          timestamp: data.timestamp,
          type: data.type === "SYSTEM" ? "system" : "user",
        },
      ]);
    });

    return () => {
      unsubStarted();
      unsubQuestion();
      unsubTimer();
      unsubPlayerAnswered();
      unsubResults();
      unsubScores();
      unsubFinished();
      unsubChat();
    };
  }, [
    roomId,
    currentUserId,
    setGamePhase,
    setTotalQuestions,
    setCurrentQuestion,
    setQuestionText,
    setQuestionId,
    setOptions,
    setQuestionType,
    setTimeLeft,
    setSelectedAnswer,
    setSelectedBet,
    setHasSubmitted,
    setCorrectAnswer,
    setQuestionResults,
    setPlayersAnswered,
    setTotalPlayers,
    setPlayerScore,
    setPlayers,
    setWinner,
    setFinalScores,
    setMessages,
  ]);
}
