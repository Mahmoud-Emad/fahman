/**
 * Game DTOs
 */

export interface SubmitAnswerDto {
  answer: number | number[];
  betAmount: number;
  timeRemaining: number;
}

export interface GameState {
  roomId: string;
  status: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: QuestionData | null;
  players: PlayerScore[];
}

export interface QuestionData {
  id: string;
  text: string;
  type: string;
  options: string[];
  timeLimit: number;
  pointValue: number;
  mediaUrl?: string | null;
  mediaType?: string | null;
}

export interface PlayerScore {
  userId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  score: number;
  isReady: boolean;
}

export interface GameResult {
  roomId: string;
  status: string;
  winner: PlayerScore | null;
  results: PlayerGameResult[];
}

export interface PlayerGameResult {
  userId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  totalScore: number;
  correctAnswers: number;
  totalAnswers: number;
  rank: number;
}
