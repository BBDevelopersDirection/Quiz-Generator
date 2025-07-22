
export interface QuizData {
  id: string;
  passage: string;
  rootCauses: string[];
  correctRootCause: string;
  explanation: string;
}

export type PlayerStatus = 'In Lobby' | 'In Progress' | 'Completed';

export interface Player {
    name: string;
    email: string;
    status?: PlayerStatus;
}

export interface Lobby {
    status: 'waiting' | 'started';
    activeQuizId?: string;
}

export interface QuizResult {
    name: string;
    email: string;
    time: number;
    quizId: string;
    completedAt: {
        seconds: number;
        nanoseconds: number;
    }
}
