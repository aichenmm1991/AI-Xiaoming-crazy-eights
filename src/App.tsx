/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CardData, GameState, Suit, Rank } from './types';
import { createDeck, SUIT_SYMBOLS, SUIT_COLORS } from './constants';
import { Card } from './components/Card';
import { SuitPicker } from './components/SuitPicker';
import { Trophy, RefreshCw, Info, User, Bot, Layers } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    playerHand: [],
    aiHand: [],
    discardPile: [],
    currentSuit: 'hearts',
    currentRank: 'A',
    status: 'dealing',
    winner: null,
    lastAction: '欢迎来到 AI Xiaoming疯狂8点！',
  });

  const [showInstructions, setShowInstructions] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Game
  const initGame = useCallback(() => {
    const fullDeck = createDeck();
    const playerHand = fullDeck.splice(0, 8);
    const aiHand = fullDeck.splice(0, 8);
    
    // Find first non-8 card for discard pile
    let firstDiscardIndex = 0;
    while (fullDeck[firstDiscardIndex].rank === '8') {
      firstDiscardIndex++;
    }
    const firstDiscard = fullDeck.splice(firstDiscardIndex, 1)[0];

    setGameState({
      deck: fullDeck,
      playerHand,
      aiHand,
      discardPile: [firstDiscard],
      currentSuit: firstDiscard.suit,
      currentRank: firstDiscard.rank,
      status: 'player_turn',
      winner: null,
      lastAction: 'Game started! Your turn.',
    });
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Check for winner
  useEffect(() => {
    if (gameState.status === 'dealing') return;
    
    if (gameState.playerHand.length === 0) {
      setGameState(prev => ({ ...prev, status: 'game_over', winner: 'player' }));
    } else if (gameState.aiHand.length === 0) {
      setGameState(prev => ({ ...prev, status: 'game_over', winner: 'ai' }));
    }
  }, [gameState.playerHand.length, gameState.aiHand.length, gameState.status]);

  const isPlayable = (card: CardData) => {
    if (card.rank === '8') return true;
    return card.suit === gameState.currentSuit || card.rank === gameState.currentRank;
  };

  const playCard = (card: CardData, isPlayer: boolean) => {
    const newHand = (isPlayer ? gameState.playerHand : gameState.aiHand).filter(c => c.id !== card.id);
    const newDiscardPile = [card, ...gameState.discardPile];
    
    if (card.rank === '8') {
      if (isPlayer) {
        setGameState(prev => ({
          ...prev,
          playerHand: newHand,
          discardPile: newDiscardPile,
          status: 'suit_picking',
          lastAction: 'You played an 8! Pick a suit.',
        }));
      } else {
        // AI logic for picking suit (picks most frequent suit in hand)
        const suitCounts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
        newHand.forEach(c => suitCounts[c.suit]++);
        const bestSuit = (Object.keys(suitCounts) as Suit[]).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b);
        
        setGameState(prev => ({
          ...prev,
          aiHand: newHand,
          discardPile: newDiscardPile,
          currentSuit: bestSuit,
          currentRank: '8',
          status: 'player_turn',
          lastAction: `Xiaoming played an 8 and chose ${bestSuit}!`,
        }));
      }
    } else {
      setGameState(prev => ({
        ...prev,
        [isPlayer ? 'playerHand' : 'aiHand']: newHand,
        discardPile: newDiscardPile,
        currentSuit: card.suit,
        currentRank: card.rank,
        status: isPlayer ? 'ai_turn' : 'player_turn',
        lastAction: `${isPlayer ? 'You' : 'Xiaoming'} played ${card.rank} of ${card.suit}.`,
      }));
    }
  };

  const drawCard = (isPlayer: boolean) => {
    if (gameState.deck.length === 0) {
      setGameState(prev => ({
        ...prev,
        status: isPlayer ? 'ai_turn' : 'player_turn',
        lastAction: `${isPlayer ? 'You' : 'Xiaoming'} had to skip (no cards in deck).`,
      }));
      return;
    }

    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.pop()!;
    const newHand = [...(isPlayer ? gameState.playerHand : gameState.aiHand), drawnCard];

    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      [isPlayer ? 'playerHand' : 'aiHand']: newHand,
      lastAction: `${isPlayer ? 'You' : 'Xiaoming'} drew a card.`,
    }));

    // If player draws, it's still their turn if they can play it? 
    // Actually standard rules: draw one, if playable you can play it, otherwise turn ends.
    // Let's simplify: draw one, turn ends.
    if (isPlayer) {
      setGameState(prev => ({ ...prev, status: 'ai_turn' }));
    } else {
      setGameState(prev => ({ ...prev, status: 'player_turn' }));
    }
  };

  // AI Turn Logic
  useEffect(() => {
    if (gameState.status === 'ai_turn') {
      const timer = setTimeout(() => {
        const playableCards = gameState.aiHand.filter(isPlayable);
        if (playableCards.length > 0) {
          // AI strategy: play non-8 first, then 8 if necessary
          const nonEight = playableCards.find(c => c.rank !== '8');
          playCard(nonEight || playableCards[0], false);
        } else {
          drawCard(false);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.status, gameState.aiHand]);

  const handleSuitSelect = (suit: Suit) => {
    setGameState(prev => ({
      ...prev,
      currentSuit: suit,
      currentRank: '8',
      status: 'ai_turn',
      lastAction: `You chose ${suit}. Xiaoming's turn.`,
    }));
  };

  return (
    <div className="min-h-screen bg-[#064e3b] text-white font-sans overflow-hidden flex flex-col p-4 sm:p-8">
      {/* Top Section: Stats and Status */}
      <div className="flex justify-between items-start w-full max-w-6xl mx-auto mb-8">
        {/* AI Stats */}
        <div className="flex flex-col items-center bg-black/20 p-4 rounded-2xl border border-white/10 w-24 sm:w-32">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white mb-2">
            <span className="text-xl sm:text-2xl font-bold">AI</span>
          </div>
          <div className="text-zinc-300 text-sm sm:text-base font-bold">对手</div>
          <div className="text-white text-lg sm:text-xl font-bold">{gameState.aiHand.length} 张牌</div>
        </div>

        {/* Status Message */}
        <div className="flex-1 flex justify-center px-4">
          <motion.div 
            key={gameState.lastAction}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-md px-8 py-4 rounded-full border border-white/10 shadow-2xl max-w-xl w-full text-center"
          >
            <span className="text-yellow-400 text-lg sm:text-2xl font-bold tracking-wide">
              {gameState.status === 'player_turn' ? '轮到你了！出牌或摸牌。' : 
               gameState.status === 'ai_turn' ? '对手正在思考...' : 
               gameState.lastAction}
            </span>
          </motion.div>
        </div>

        {/* Player Stats */}
        <div className="flex flex-col items-center bg-black/20 p-4 rounded-2xl border border-white/10 w-24 sm:w-32">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white mb-2">
            <span className="text-xl sm:text-2xl font-bold">我</span>
          </div>
          <div className="text-zinc-300 text-sm sm:text-base font-bold">玩家</div>
          <div className="text-white text-lg sm:text-xl font-bold">{gameState.playerHand.length} 张牌</div>
        </div>
      </div>

      {/* Middle Section: Piles */}
      <div className="flex-1 flex flex-col items-center justify-center gap-12">
        <div className="flex items-center gap-12 sm:gap-24">
          {/* Draw Pile */}
          <div className="flex flex-col items-center gap-3">
            <div 
              onClick={() => gameState.status === 'player_turn' && drawCard(true)}
              className={`relative w-20 h-28 sm:w-28 sm:h-40 rounded-xl border-2 border-white/20 bg-[#3b5998] shadow-2xl cursor-pointer transition-transform hover:scale-105 active:scale-95 flex items-center justify-center ${gameState.status !== 'player_turn' ? 'opacity-80' : 'ring-4 ring-yellow-400/30'}`}
            >
              <div className="grid grid-cols-3 gap-1 opacity-20">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-white rounded-full" />
                ))}
              </div>
              <span className="absolute text-3xl sm:text-5xl font-bold text-white drop-shadow-md">
                {gameState.deck.length}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-zinc-300/80">摸牌堆</div>
          </div>

          {/* Discard Pile */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-20 h-28 sm:w-28 sm:h-40">
              <AnimatePresence mode="popLayout">
                {gameState.discardPile.slice(0, 1).map((card) => (
                  <motion.div
                    key={card.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0"
                  >
                    <Card card={card} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="bg-black/20 px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-zinc-300/80">当前花色:</span>
              <span className={`text-lg ${SUIT_COLORS[gameState.currentSuit]}`}>
                {SUIT_SYMBOLS[gameState.currentSuit]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Player Hand */}
      <div className="mt-auto pb-8 flex flex-col items-center">
        <div className="flex justify-center -space-x-8 sm:-space-x-12 hover:-space-x-4 transition-all duration-300">
          <AnimatePresence>
            {gameState.playerHand.map((card, index) => (
              <Card 
                key={card.id} 
                card={card} 
                className="z-[index]"
                isPlayable={gameState.status === 'player_turn' && isPlayable(card)}
                onClick={() => playCard(card, true)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {gameState.status === 'suit_picking' && (
          <SuitPicker onSelect={handleSuitSelect} />
        )}

        {gameState.status === 'game_over' && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-[#141414]"
            >
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Trophy size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-serif italic font-bold mb-2 text-zinc-900">
                {gameState.winner === 'player' ? '胜利！' : '失败！'}
              </h2>
              <p className="text-zinc-500 mb-8">
                {gameState.winner === 'player' 
                  ? "你打败了小明！太棒了。" 
                  : "小明赢了。再来一局？"}
              </p>
              <button 
                onClick={initGame}
                className="w-full py-4 bg-[#141414] text-[#E4E3E0] rounded-xl font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                重新开始
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
