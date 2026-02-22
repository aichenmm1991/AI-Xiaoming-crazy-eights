
import React from 'react';
import { motion } from 'motion/react';
import { CardData, Suit } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS, BIRD_SPECIES } from '../constants';

interface CardProps {
  card: CardData;
  hidden?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ card, hidden, onClick, isPlayable, className = '' }) => {
  const { suit, rank } = card;

  if (hidden) {
    return (
      <motion.div
        layoutId={card.id}
        className={`relative w-16 h-24 sm:w-24 sm:h-36 bg-emerald-700 rounded-lg border-2 border-white/40 shadow-lg flex items-center justify-center overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 sm:w-16 sm:h-16 bg-emerald-50 rounded-full border-2 border-emerald-800 flex items-center justify-center shadow-inner">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-amber-500 rounded-full" />
          </div>
          <span className="text-white text-xl sm:text-3xl font-bold italic mt-2 drop-shadow-md">8</span>
        </div>
      </motion.div>
    );
  }

  const bird = BIRD_SPECIES[rank];
  const birdName = bird.zh;
  const birdEn = bird.en;

  return (
    <motion.div
      layoutId={card.id}
      whileHover={isPlayable ? { y: -10, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`relative w-16 h-24 sm:w-24 sm:h-36 bg-white rounded-lg border-2 ${
        isPlayable ? 'border-emerald-500 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-4 ring-emerald-500/30' : 'border-zinc-200 shadow-sm'
      } overflow-hidden select-none ${className}`}
    >
      {/* Card Background Texture */}
      <div className="absolute inset-0 bg-emerald-50/30 opacity-50" />

      {/* Bird Illustration */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <img 
          src={`https://loremflickr.com/400/600/bird,nature,${birdEn.replace(/\s+/g, '')}/all`} 
          alt={birdName}
          className="w-full h-full object-cover opacity-95 transition-transform hover:scale-110 duration-500"
          referrerPolicy="no-referrer"
        />
        {/* Subtle vignette for focus */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent" />
      </div>

      {/* Top Left Info */}
      <div className={`absolute top-1 left-1 sm:top-2 sm:left-2 flex flex-col items-center leading-none z-10 ${SUIT_COLORS[suit]} drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]`}>
        <span className="text-xl sm:text-3xl font-bold">{rank}</span>
        <span className="text-sm sm:text-xl">{SUIT_SYMBOLS[suit]}</span>
      </div>

      {/* Bird Name Overlay */}
      <div className="absolute bottom-2 left-0 right-0 text-center z-10">
        <div className="inline-block bg-emerald-600/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold text-white border border-white/40 shadow-sm">
          {birdName}
        </div>
      </div>

      {/* Bottom Right Info (Rotated) */}
      <div className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 flex flex-col items-center leading-none z-10 rotate-180 ${SUIT_COLORS[suit]} drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]`}>
        <span className="text-xl sm:text-3xl font-bold">{rank}</span>
        <span className="text-sm sm:text-xl">{SUIT_SYMBOLS[suit]}</span>
      </div>

      {/* Nature Icon Placeholder */}
      <div className="absolute top-2 right-2 w-5 h-5 sm:w-7 sm:h-7 bg-amber-400 rounded-full border-2 border-amber-600 shadow-sm flex items-center justify-center z-10">
        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-zinc-800 rounded-full" />
      </div>

      {/* Interactive Glow for Playable Cards */}
      {isPlayable && (
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 bg-emerald-500/10 pointer-events-none"
        />
      )}
    </motion.div>
  );
};
