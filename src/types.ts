
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface CardData {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type PlayerID = 'player' | 'ai1' | 'ai2' | 'ai3';

export type GameStatus = 'landing' | 'playing' | 'suit_picking' | 'game_over';

export interface GameState {
  deck: CardData[];
  hands: Record<PlayerID, CardData[]>;
  discardPile: CardData[];
  currentSuit: Suit;
  currentRank: Rank;
  status: GameStatus;
  turn: PlayerID;
  winner: PlayerID | null;
  lastAction: string;
}
