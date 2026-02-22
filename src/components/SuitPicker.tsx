
import React from 'react';
import { motion } from 'motion/react';
import { Suit } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../constants';

interface SuitPickerProps {
  onSelect: (suit: Suit) => void;
}

export const SuitPicker: React.FC<SuitPickerProps> = ({ onSelect }) => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center"
      >
        <h2 className="text-2xl font-bold mb-2 text-zinc-900">Crazy Eight!</h2>
        <p className="text-zinc-500 mb-6 italic">Choose the next suit to play</p>
        
        <div className="grid grid-cols-2 gap-4">
          {suits.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelect(suit)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 border-zinc-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all group`}
            >
              <span className={`text-4xl mb-2 ${SUIT_COLORS[suit]}`}>
                {SUIT_SYMBOLS[suit]}
              </span>
              <span className="text-xs uppercase tracking-widest font-semibold text-zinc-400 group-hover:text-indigo-600">
                {suit}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
