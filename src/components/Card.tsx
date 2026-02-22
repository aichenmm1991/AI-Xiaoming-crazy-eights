
import React from 'react';
import { motion } from 'motion/react';
import { CardData, Suit } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../constants';

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
        className={`relative w-16 h-24 sm:w-24 sm:h-36 bg-[#3b5998] rounded-lg border-2 border-white/20 shadow-md flex items-center justify-center overflow-hidden ${className}`}
      >
        <div className="grid grid-cols-3 gap-1 opacity-20">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-2 h-2 bg-white rounded-full" />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layoutId={card.id}
      whileHover={isPlayable ? { y: -10, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`relative w-16 h-24 sm:w-24 sm:h-36 bg-white rounded-lg border-2 ${
        isPlayable ? 'border-yellow-400 cursor-pointer shadow-[0_0_15px_rgba(250,204,21,0.6)] ring-4 ring-yellow-400/50' : 'border-zinc-200 shadow-sm'
      } flex flex-col justify-between p-1 sm:p-2 select-none ${className}`}
    >
      <div className={`flex flex-col items-start leading-none ${SUIT_COLORS[suit]}`}>
        <span className="text-sm sm:text-lg font-bold">{rank}</span>
        <span className="text-xs sm:text-sm">{SUIT_SYMBOLS[suit]}</span>
      </div>
      
      <div className={`flex items-center justify-center text-2xl sm:text-4xl ${SUIT_COLORS[suit]}`}>
        {SUIT_SYMBOLS[suit]}
      </div>

      <div className={`flex flex-col items-end leading-none rotate-180 ${SUIT_COLORS[suit]}`}>
        <span className="text-sm sm:text-lg font-bold">{rank}</span>
        <span className="text-xs sm:text-sm">{SUIT_SYMBOLS[suit]}</span>
      </div>
    </motion.div>
  );
};
