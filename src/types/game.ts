export type GameStage = 
  | 'TITLE'
  | 'REGISTRATION'
  | 'PLAYING_ARCADE'
  | 'PLAYING_TRIVIA'
  | 'TEACHING_RESULTS'
  | 'ADMIN_PANEL';

export interface PlayerInfo {
  name: string;
  cedula: string;
  area: string;
}

export interface GameResults {
  player: PlayerInfo;
  arcadeScore: number;
  triviaScore: number;
  totalScore: number;
  finalGlucose: number;
  triviaCorrect: number;
  triviaTotal: number;
  stars: number;
  timeSeconds: number;
  rank?: number;
  isWinner?: boolean;
}

export interface ParticipantRecord {
  id: string;
  name: string;
  cedula: string;
  area: string;
  score: number;
  stars: number;
  glucoseLevel: number;
  triviaCorrect: number;
  triviaTotal: number;
  timeSeconds: number;
  rank?: number;
  createdAt: string;
  isWinner?: boolean;
}

export interface StatsResponse {
  totalPlayers: number;
  averageScore: number;
  highestScore: number;
  preventionAccuracyPct: number;
}
