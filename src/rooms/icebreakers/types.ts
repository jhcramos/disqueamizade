export type Action = 'state' | 'start' | 'answer' | 'withdraw' | 'react'
export type Answer = { id: string; text: string; userId?: string; username?: string; isMine?: boolean; meToo?: number; reacted?: boolean }
export type Round = {
 phase: 'idle' | 'answering' | 'guessing' | 'revealed' | 'finished'; serverNow: string;
 id?: string; question?: string; answerUntil?: string; guessUntil?: string; endAt?: string; nextAt?: string;
 count?: number; ownAnswer?: string | null; answers?: Answer[]; candidates?: { id: string; name: string }[];
}
export type Input = { action: Action; roundId?: string; text?: string; answerId?: string }
