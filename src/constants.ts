
import { Suit, Rank, CardData } from './types';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const SUIT_COLORS: Record<Suit, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-zinc-900',
  spades: 'text-zinc-900',
};

export const createDeck = (): CardData[] => {
  const deck: CardData[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
      });
    });
  });
  return shuffle(deck);
};

export const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const BIRD_SPECIES: Record<Rank, { zh: string; en: string }> = {
  'A': { zh: '老鹰', en: 'Eagle' },
  '2': { zh: '麻雀', en: 'Sparrow' },
  '3': { zh: '知更鸟', en: 'Robin' },
  '4': { zh: '猫头鹰', en: 'Owl' },
  '5': { zh: '鹦鹉', en: 'Parrot' },
  '6': { zh: '企鹅', en: 'Penguin' },
  '7': { zh: '天鹅', en: 'Swan' },
  '8': { zh: '翠鸟', en: 'Kingfisher' },
  '9': { zh: '啄木鸟', en: 'Woodpecker' },
  '10': { zh: '火烈鸟', en: 'Flamingo' },
  'J': { zh: '孔雀', en: 'Peacock' },
  'Q': { zh: '蜂鸟', en: 'Hummingbird' },
  'K': { zh: '猎鹰', en: 'Falcon' },
};

export const PLAYER_NAMES: Record<string, string> = {
  player: '你',
  ai1: '森林之友 A',
  ai2: '森林之友 B',
  ai3: '森林之友 C',
};

export const PLAY_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3';
export const DRAW_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2007/2007-preview.mp3';
export const BGM_URL = 'https://assets.mixkit.co/active_storage/sfx/123/123-preview.mp3'; // Placeholder, will find a better one if possible
// Better BGM: something calm. Mixkit has some free ones.
export const CALM_BGM_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'; 
