import { create } from 'zustand';

export const RoundStatus = {
  WAITING_FOR_BETS: 'WAITING_FOR_BETS',
  STARTING: 'STARTING',
  IN_PROGRESS: 'IN_PROGRESS',
  CRASHED: 'CRASHED',
} as const;

export type RoundStatus = keyof typeof RoundStatus;

export interface Bet {
  playerId: string;
  username: string;
  amount: number;
  betId: string;
  cashedOut: boolean;
  cashOutMultiplier?: number;
  payout?: number;
}

export interface Round {
  id: string;
  status: RoundStatus;
  multiplier: number;
  serverSeedHash?: string;
  serverSeed?: string;
}

export interface GameHistory {
  id: string;
  multiplier: number;
  serverSeed: string;
}

interface GameState {
  currentRoundId: string | null;
  status: RoundStatus;
  multiplier: number;
  bets: Bet[];
  history: GameHistory[];
  lastCrash: number | null;
  serverSeedHash: string | null;
  
  setRound: (round: Round) => void;
  updateMultiplier: (m: number) => void;
  addBet: (bet: Bet) => void;
  updateBetCashout: (betId: string, multiplier: number, payout: number) => void;
  setHistory: (history: GameHistory[]) => void;
  crash: (multiplier: number, serverSeed: string) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentRoundId: null,
  status: 'WAITING_FOR_BETS',
  multiplier: 1.0,
  bets: [],
  history: [],
  lastCrash: null,
  serverSeedHash: null,

  setRound: (round) => set({ 
    currentRoundId: round.id, 
    status: round.status, 
    multiplier: round.multiplier || 1.0,
    serverSeedHash: round.serverSeedHash || null
  }),
  
  updateMultiplier: (m) => set({ multiplier: m, status: 'IN_PROGRESS' }),
  
  addBet: (bet) => set((state) => ({ 
    bets: [...state.bets, { ...bet, cashedOut: bet.cashedOut || false }] 
  })),

  updateBetCashout: (betId, multiplier, payout) => set((state) => ({
    bets: state.bets.map(bet => 
      bet.betId === betId 
        ? { ...bet, cashedOut: true, cashOutMultiplier: multiplier, payout } 
        : bet
    )
  })),
  
  setHistory: (history) => set({ history }),
  
  crash: (multiplier, serverSeed) => set((state) => ({ 
    status: 'CRASHED', 
    multiplier, 
    lastCrash: multiplier,
    history: [{ multiplier, serverSeed, id: state.currentRoundId || '' }, ...state.history].slice(0, 20)
  })),

  reset: () => set({ bets: [], multiplier: 1.0 })
}));
