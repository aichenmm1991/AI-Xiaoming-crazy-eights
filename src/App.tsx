/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CardData, GameState, Suit, Rank } from './types';
import { createDeck, SUIT_SYMBOLS, SUIT_COLORS, PLAY_SOUND_URL, DRAW_SOUND_URL } from './constants';
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
    status: 'landing',
    winner: null,
    lastAction: '欢迎来到 AI Xiaoming疯狂8点！',
  });

  const [showInstructions, setShowInstructions] = useState(false);
  
  const playSound = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(e => console.log('Sound play blocked', e));
  };

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
      lastAction: '游戏开始！轮到你了。',
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
    playSound(PLAY_SOUND_URL);
    const newHand = (isPlayer ? gameState.playerHand : gameState.aiHand).filter(c => c.id !== card.id);
    const newDiscardPile = [card, ...gameState.discardPile];
    
    if (card.rank === '8') {
      if (isPlayer) {
        setGameState(prev => ({
          ...prev,
          playerHand: newHand,
          discardPile: newDiscardPile,
          status: 'suit_picking',
          lastAction: '你打出了一个 8！请选择花色。',
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
          lastAction: `小明打出了 8 并选择了 ${bestSuit}！`,
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
        lastAction: `${isPlayer ? '你' : '小明'} 打出了 ${card.rank} (${card.suit})。`,
      }));
    }
  };

  const drawCard = (isPlayer: boolean) => {
    playSound(DRAW_SOUND_URL);
    if (gameState.deck.length === 0) {
      setGameState(prev => ({
        ...prev,
        status: isPlayer ? 'ai_turn' : 'player_turn',
        lastAction: `${isPlayer ? '你' : '小明'} 必须跳过（牌堆已空）。`,
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
      lastAction: `${isPlayer ? '你' : '小明'} 摸了一张牌。`,
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
      lastAction: `你选择了 ${suit}。轮到小明了。`,
    }));
  };

  return (
    <div className="min-h-screen bg-[#062016] text-white font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <span className="text-white font-bold text-xl italic">8</span>
          </div>
          <h1 className="font-serif italic text-2xl font-bold tracking-tight">AI Xiaoming疯狂8点</h1>
        </div>
        
        {gameState.status !== 'landing' && (
          <div className="flex items-center gap-4">
            <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${gameState.status === 'player_turn' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="text-sm font-medium text-zinc-300">
                {gameState.status === 'player_turn' ? '你的回合' : '对手回合'}
              </span>
            </div>
            <button 
              onClick={initGame}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        {gameState.status === 'landing' ? (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#0A2A1E] border-2 border-emerald-500/30 rounded-[40px] p-8 sm:p-12 max-w-2xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              {/* Subtle emerald glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 blur-[100px] rounded-full" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[100px] rounded-full" />

              <h1 className="text-4xl sm:text-5xl font-bold text-emerald-400 text-center mb-10 tracking-widest">
                游戏规则
              </h1>

              <div className="space-y-6 text-left mb-12">
                {[
                  { title: '发牌', text: '每位玩家初始分得 8 张牌。' },
                  { title: '出牌', text: '你出的牌必须在“花色”或“点数”上与弃牌堆最顶部的牌匹配。' },
                  { title: '万能 8 点', text: '数字“8”是万用牌。你可以在任何时候打出 8，并随后指定一个新的花色。' },
                  { title: '摸牌', text: '如果无牌可出，必须从摸牌堆摸一张牌。如果摸牌堆为空，则跳过该回合。' },
                  { title: '获胜', text: '最先清空手牌的一方获胜。' },
                ].map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-4 group">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-emerald-400 text-xs font-bold">{idx + 1}</span>
                    </div>
                    <p className="text-zinc-300 text-base sm:text-lg leading-relaxed">
                      <span className="text-emerald-400 font-bold mr-2">{rule.title}:</span>
                      {rule.text}
                    </p>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02, brightness: 1.1 }}
                whileTap={{ scale: 0.98 }}
                onClick={initGame}
                className="w-full py-5 bg-gradient-to-b from-emerald-400 to-emerald-700 text-white rounded-2xl font-bold text-xl sm:text-2xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] transition-all"
              >
                我知道了，开始游戏
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.main 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 relative flex flex-col p-4 gap-4 max-w-6xl mx-auto w-full"
          >
            {/* Top Section: Stats */}
            <div className="flex justify-between items-start w-full mb-4">
              <div className="flex flex-col items-center bg-white/5 p-4 rounded-2xl border border-white/10 w-24 sm:w-32">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/50 mb-2 overflow-hidden">
                  <img src="https://loremflickr.com/100/100/bird,face/all" alt="小明" className="w-full h-full object-cover" />
                </div>
                <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest">小明</div>
                <div className="text-white text-lg sm:text-xl font-bold">{gameState.aiHand.length} 张牌</div>
              </div>

              <div className="flex flex-col items-center bg-white/5 p-4 rounded-2xl border border-white/10 w-24 sm:w-32">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/50 mb-2">
                  <span className="text-xl sm:text-2xl font-bold text-emerald-400">我</span>
                </div>
                <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest">玩家</div>
                <div className="text-white text-lg sm:text-xl font-bold">{gameState.playerHand.length} 张牌</div>
              </div>
            </div>

            {/* Middle Section: Piles */}
            <div className="flex-1 flex flex-col items-center justify-center gap-12">
              <div className="flex items-center gap-12 sm:gap-24">
                <div className="flex flex-col items-center gap-3">
                  <div 
                    onClick={() => gameState.status === 'player_turn' && drawCard(true)}
                    className={`relative w-20 h-28 sm:w-28 sm:h-40 rounded-xl border-2 border-white/10 bg-emerald-700 shadow-2xl cursor-pointer transition-transform hover:scale-105 active:scale-95 flex items-center justify-center ${gameState.status !== 'player_turn' ? 'opacity-80' : 'ring-4 ring-emerald-500/30'}`}
                  >
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                    <span className="absolute text-3xl sm:text-5xl font-bold text-white drop-shadow-md italic">8</span>
                    <div className="absolute bottom-2 right-2 text-white/40 text-xs font-mono">{gameState.deck.length}</div>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-zinc-500 uppercase tracking-widest">摸牌堆</div>
                </div>

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
                  <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">当前花色:</span>
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
          </motion.main>
        )}
      </AnimatePresence>

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
              className="bg-[#1A1A2E] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-white/10"
            >
              <div className="w-20 h-20 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-yellow-400/50">
                <Trophy size={40} className="text-yellow-400" />
              </div>
              <h2 className="text-3xl font-serif italic font-bold mb-2 text-white">
                {gameState.winner === 'player' ? '胜利！' : '失败！'}
              </h2>
              <p className="text-zinc-400 mb-8">
                {gameState.winner === 'player' 
                  ? "你打败了小明！太棒了。" 
                  : "小明赢了。再来一局？"}
              </p>
              <button 
                onClick={initGame}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold tracking-widest uppercase hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
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
