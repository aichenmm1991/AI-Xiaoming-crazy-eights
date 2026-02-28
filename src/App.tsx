/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CardData, GameState, Suit, Rank, PlayerID } from './types';
import { createDeck, SUIT_SYMBOLS, SUIT_COLORS, PLAY_SOUND_URL, DRAW_SOUND_URL, CALM_BGM_URL, PLAYER_NAMES } from './constants';
import { Card } from './components/Card';
import { SuitPicker } from './components/SuitPicker';
import { Trophy, RefreshCw, Info, User, Bot, Layers, Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    hands: {
      player: [],
      ai1: [],
      ai2: [],
      ai3: [],
    },
    discardPile: [],
    currentSuit: 'hearts',
    currentRank: 'A',
    status: 'landing',
    turn: 'player',
    winner: null,
    lastAction: '欢迎来到 AI Xiaoming疯狂8点！',
  });

  const [isMuted, setIsMuted] = useState(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!bgmRef.current) {
      bgmRef.current = new Audio(CALM_BGM_URL);
      bgmRef.current.loop = true;
      bgmRef.current.volume = 0.25;
    }

    if (!isMuted && gameState.status !== 'game_over') {
      bgmRef.current.play().catch(e => console.log('BGM play blocked', e));
    } else {
      bgmRef.current.pause();
    }

    return () => {
      if (bgmRef.current) bgmRef.current.pause();
    };
  }, [gameState.status, isMuted]);

  const playSound = (url: string) => {
    if (isMuted) return;
    const audio = new Audio(url);
    audio.play().catch(e => console.log('Sound play blocked', e));
  };

  // Initialize Game
  const initGame = useCallback(() => {
    const fullDeck = createDeck();
    const hands: Record<PlayerID, CardData[]> = {
      player: fullDeck.splice(0, 8),
      ai1: fullDeck.splice(0, 8),
      ai2: fullDeck.splice(0, 8),
      ai3: fullDeck.splice(0, 8),
    };
    
    // Find first non-8 card for discard pile
    let firstDiscardIndex = 0;
    while (fullDeck[firstDiscardIndex].rank === '8') {
      firstDiscardIndex++;
    }
    const firstDiscard = fullDeck.splice(firstDiscardIndex, 1)[0];

    setGameState({
      deck: fullDeck,
      hands,
      discardPile: [firstDiscard],
      currentSuit: firstDiscard.suit,
      currentRank: firstDiscard.rank,
      status: 'playing',
      turn: 'player',
      winner: null,
      lastAction: '游戏开始！轮到你了。',
    });
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Check for winner
  useEffect(() => {
    if (gameState.status !== 'playing') return;
    
    for (const playerID in gameState.hands) {
      if (gameState.hands[playerID as PlayerID].length === 0) {
        setGameState(prev => ({ ...prev, status: 'game_over', winner: playerID as PlayerID }));
        return;
      }
    }
  }, [gameState.hands, gameState.status]);

  const isPlayable = (card: CardData) => {
    if (card.rank === '8') return true;
    return card.suit === gameState.currentSuit || card.rank === gameState.currentRank;
  };

  const getNextPlayer = (current: PlayerID): PlayerID => {
    const sequence: PlayerID[] = ['player', 'ai1', 'ai2', 'ai3'];
    const index = sequence.indexOf(current);
    return sequence[(index + 1) % sequence.length];
  };

  const playCard = (card: CardData, playerID: PlayerID) => {
    playSound(PLAY_SOUND_URL);
    const newHand = gameState.hands[playerID].filter(c => c.id !== card.id);
    const newDiscardPile = [card, ...gameState.discardPile];
    const nextPlayer = getNextPlayer(playerID);
    
    if (card.rank === '8') {
      if (playerID === 'player') {
        setGameState(prev => ({
          ...prev,
          hands: { ...prev.hands, [playerID]: newHand },
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
          hands: { ...prev.hands, [playerID]: newHand },
          discardPile: newDiscardPile,
          currentSuit: bestSuit,
          currentRank: '8',
          turn: nextPlayer,
          lastAction: `${PLAYER_NAMES[playerID]} 打出了 8 并选择了 ${bestSuit}！`,
        }));
      }
    } else {
      setGameState(prev => ({
        ...prev,
        hands: { ...prev.hands, [playerID]: newHand },
        discardPile: newDiscardPile,
        currentSuit: card.suit,
        currentRank: card.rank,
        turn: nextPlayer,
        lastAction: `${PLAYER_NAMES[playerID]} 打出了 ${card.rank} (${card.suit})。`,
      }));
    }
  };

  const drawCard = (playerID: PlayerID) => {
    playSound(DRAW_SOUND_URL);
    const nextPlayer = getNextPlayer(playerID);

    if (gameState.deck.length === 0) {
      setGameState(prev => ({
        ...prev,
        turn: nextPlayer,
        lastAction: `${PLAYER_NAMES[playerID]} 必须跳过（牌堆已空）。`,
      }));
      return;
    }

    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.pop()!;
    const newHand = [...gameState.hands[playerID], drawnCard];

    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      hands: { ...prev.hands, [playerID]: newHand },
      turn: nextPlayer,
      lastAction: `${PLAYER_NAMES[playerID]} 摸了一张牌。`,
    }));
  };

  // AI Turn Logic
  useEffect(() => {
    if (gameState.status === 'playing' && gameState.turn.startsWith('ai')) {
      const timer = setTimeout(() => {
        const currentAI = gameState.turn as PlayerID;
        const playableCards = gameState.hands[currentAI].filter(isPlayable);
        if (playableCards.length > 0) {
          // AI strategy: play non-8 first, then 8 if necessary
          const nonEight = playableCards.find(c => c.rank !== '8');
          playCard(nonEight || playableCards[0], currentAI);
        } else {
          drawCard(currentAI);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.status, gameState.turn, gameState.hands]);

  const handleSuitSelect = (suit: Suit) => {
    setGameState(prev => ({
      ...prev,
      currentSuit: suit,
      currentRank: '8',
      status: 'playing',
      turn: 'ai1',
      lastAction: `你选择了 ${suit}。轮到森林之友 A 了。`,
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
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
              title={isMuted ? "开启音乐" : "静音"}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              <span className="text-xs font-bold hidden sm:inline">{isMuted ? "音乐已关" : "背景音乐"}</span>
            </button>
            <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${gameState.turn === 'player' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="text-sm font-medium text-zinc-300">
                {gameState.turn === 'player' ? '你的回合' : `${PLAYER_NAMES[gameState.turn]}的回合`}
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
                  { title: '四人对战', text: '你将与三位“森林之友”AI 进行对战。' },
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
            {/* 4 Player Table Layout */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[90%] h-[70%] border-2 border-emerald-500/20 rounded-[120px] bg-emerald-900/20 backdrop-blur-sm shadow-[inset_0_0_100px_rgba(16,185,129,0.1)]" />
              {/* Decorative Nature Elements */}
              <div className="absolute top-10 left-10 opacity-10 rotate-12"><Layers size={120} className="text-emerald-500" /></div>
              <div className="absolute bottom-10 right-10 opacity-10 -rotate-12"><Layers size={120} className="text-emerald-500" /></div>
            </div>

            {/* Top: AI 1 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pt-2">
              <div className="relative mb-1">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-emerald-900/40 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${gameState.turn === 'ai1' ? 'border-emerald-400 scale-110 shadow-[0_0_20px_rgba(52,211,153,0.6)] ring-4 ring-emerald-400/20' : 'border-emerald-500/30'} overflow-hidden`}>
                  <img src="https://loremflickr.com/100/100/bird,face/all?lock=1" alt="AI 1" className="w-full h-full object-cover" />
                </div>
                {gameState.turn === 'ai1' && (
                  <motion.div 
                    layoutId="turn-indicator"
                    className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Bot size={12} />
                  </motion.div>
                )}
              </div>
              <div className="text-emerald-400/80 text-[9px] font-bold uppercase tracking-widest mb-1">{PLAYER_NAMES.ai1}</div>
              <div className="flex -space-x-20 sm:-space-x-28 scale-[0.4] sm:scale-[0.6] origin-top">
                {gameState.hands.ai1.slice(0, 8).map((card) => (
                  <Card key={card.id} card={card} hidden className="shadow-2xl border-emerald-900/50" />
                ))}
                {gameState.hands.ai1.length > 8 && (
                  <div className="w-16 h-24 sm:w-24 sm:h-36 bg-emerald-800 rounded-lg border-2 border-emerald-400/30 flex items-center justify-center text-white font-bold text-2xl ml-6 shadow-xl">
                    +{gameState.hands.ai1.length - 8}
                  </div>
                )}
              </div>
            </div>

            {/* Left: AI 2 */}
            <div className="absolute left-0 top-[40%] -translate-y-1/2 flex items-center gap-2 z-20 pl-2">
              <div className="flex flex-col items-center">
                <div className="relative mb-1">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-emerald-900/40 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${gameState.turn === 'ai2' ? 'border-emerald-400 scale-110 shadow-[0_0_20px_rgba(52,211,153,0.6)] ring-4 ring-emerald-400/20' : 'border-emerald-500/30'} overflow-hidden`}>
                    <img src="https://loremflickr.com/100/100/bird,face/all?lock=2" alt="AI 2" className="w-full h-full object-cover" />
                  </div>
                  {gameState.turn === 'ai2' && (
                    <motion.div 
                      layoutId="turn-indicator"
                      className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Bot size={12} />
                    </motion.div>
                  )}
                </div>
                <div className="text-emerald-400/80 text-[9px] font-bold uppercase tracking-widest">{PLAYER_NAMES.ai2}</div>
                <div className="text-white text-[10px] font-bold mt-0.5">{gameState.hands.ai2.length} 张</div>
              </div>
              <div className="flex flex-col -space-y-24 sm:-space-y-32 scale-[0.4] sm:scale-[0.6] origin-left rotate-6">
                {gameState.hands.ai2.slice(0, 5).map((card) => (
                  <Card key={card.id} card={card} hidden className="shadow-2xl border-emerald-900/50" />
                ))}
                {gameState.hands.ai2.length > 5 && (
                  <div className="w-16 h-24 sm:w-24 sm:h-36 bg-emerald-800 rounded-lg border-2 border-emerald-400/30 flex items-center justify-center text-white font-bold text-2xl mt-4 shadow-xl">
                    +{gameState.hands.ai2.length - 5}
                  </div>
                )}
              </div>
            </div>

            {/* Right: AI 3 */}
            <div className="absolute right-0 top-[40%] -translate-y-1/2 flex flex-row-reverse items-center gap-2 z-20 pr-2">
              <div className="flex flex-col items-center">
                <div className="relative mb-1">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-emerald-900/40 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${gameState.turn === 'ai3' ? 'border-emerald-400 scale-110 shadow-[0_0_20px_rgba(52,211,153,0.6)] ring-4 ring-emerald-400/20' : 'border-emerald-500/30'} overflow-hidden`}>
                    <img src="https://loremflickr.com/100/100/bird,face/all?lock=3" alt="AI 3" className="w-full h-full object-cover" />
                  </div>
                  {gameState.turn === 'ai3' && (
                    <motion.div 
                      layoutId="turn-indicator"
                      className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Bot size={12} />
                    </motion.div>
                  )}
                </div>
                <div className="text-emerald-400/80 text-[9px] font-bold uppercase tracking-widest">{PLAYER_NAMES.ai3}</div>
                <div className="text-white text-[10px] font-bold mt-0.5">{gameState.hands.ai3.length} 张</div>
              </div>
              <div className="flex flex-col -space-y-24 sm:-space-y-32 scale-[0.4] sm:scale-[0.6] origin-right -rotate-6">
                {gameState.hands.ai3.slice(0, 5).map((card) => (
                  <Card key={card.id} card={card} hidden className="shadow-2xl border-emerald-900/50" />
                ))}
                {gameState.hands.ai3.length > 5 && (
                  <div className="w-16 h-24 sm:w-24 sm:h-36 bg-emerald-800 rounded-lg border-2 border-emerald-400/30 flex items-center justify-center text-white font-bold text-2xl mt-4 shadow-xl">
                    +{gameState.hands.ai3.length - 5}
                  </div>
                )}
              </div>
            </div>

            {/* Middle Section: Piles */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 z-10 mt-24 sm:mt-32">
              <div className="flex items-center gap-12 sm:gap-24">
                <div className="flex flex-col items-center gap-2">
                  <motion.div 
                    whileHover={gameState.turn === 'player' ? { scale: 1.05, y: -5 } : {}}
                    whileTap={gameState.turn === 'player' ? { scale: 0.95 } : {}}
                    onClick={() => gameState.status === 'playing' && gameState.turn === 'player' && drawCard('player')}
                    className={`relative w-16 h-24 sm:w-24 sm:h-36 rounded-xl border-2 border-emerald-400/20 bg-emerald-800 shadow-[0_15px_30px_rgba(0,0,0,0.4)] cursor-pointer transition-all duration-300 flex items-center justify-center ${gameState.turn !== 'player' ? 'opacity-60 grayscale-[0.5]' : 'ring-4 ring-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]'}`}
                  >
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                    <span className="absolute text-2xl sm:text-4xl font-bold text-white/80 drop-shadow-md italic">8</span>
                    <div className="absolute bottom-1 right-1 bg-black/40 px-1 py-0.5 rounded text-white/60 text-[8px] sm:text-[10px] font-mono">{gameState.deck.length}</div>
                  </motion.div>
                  <div className="text-[8px] sm:text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">摸牌堆</div>
                </div>

                {/* Discard Pile - Shifted further right to avoid overlap with AI 1 */}
                <div className="flex flex-col items-center gap-2 translate-x-8 sm:translate-x-16">
                  <div className="relative w-16 h-24 sm:w-24 sm:h-36">
                    <AnimatePresence mode="popLayout">
                      {gameState.discardPile.slice(0, 1).map((card) => (
                        <motion.div
                          key={card.id}
                          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          className="absolute inset-0"
                        >
                          <Card card={card} className="shadow-2xl" />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <div className="bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5 backdrop-blur-sm">
                    <span className="text-[8px] sm:text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">花色:</span>
                    <span className={`text-base sm:text-lg ${SUIT_COLORS[gameState.currentSuit]}`}>
                      {SUIT_SYMBOLS[gameState.currentSuit]}
                    </span>
                  </div>
                </div>
              </div>
              
              <motion.div 
                key={gameState.lastAction}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[180px] sm:max-w-xs text-center text-emerald-300 text-[10px] sm:text-xs font-medium bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 backdrop-blur-md shadow-lg"
              >
                {gameState.lastAction}
              </motion.div>
            </div>

            {/* Bottom Section: Player Hand */}
            <div className="mt-auto pb-6 flex flex-col items-center z-30">
              <div className="mb-4 flex flex-col items-center">
                <div className="relative">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-emerald-900/40 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${gameState.turn === 'player' ? 'border-emerald-400 scale-110 shadow-[0_0_20px_rgba(52,211,153,0.6)] ring-4 ring-emerald-400/20' : 'border-emerald-500/30'} mb-1`}>
                    <User size={28} className="text-emerald-400" />
                  </div>
                  {gameState.turn === 'player' && (
                    <motion.div 
                      layoutId="turn-indicator"
                      className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <User size={14} />
                    </motion.div>
                  )}
                </div>
                <div className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-widest">你 ({gameState.hands.player.length} 张)</div>
              </div>
              <div className="flex justify-center -space-x-10 sm:-space-x-14 hover:-space-x-4 transition-all duration-500">
                <AnimatePresence>
                  {gameState.hands.player.map((card, index) => (
                    <Card 
                      key={card.id} 
                      card={card} 
                      className="z-[index]"
                      isPlayable={gameState.status === 'playing' && gameState.turn === 'player' && isPlayable(card)}
                      onClick={() => playCard(card, 'player')}
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
                {gameState.winner === 'player' ? '胜利！' : '游戏结束'}
              </h2>
              <p className="text-zinc-400 mb-8">
                {gameState.winner === 'player' 
                  ? "你打败了所有森林之友！太棒了。" 
                  : `${PLAYER_NAMES[gameState.winner!]} 赢了。再来一局？`}
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
