
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
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center border-4 border-emerald-400"
      >
        <div className="w-16 h-16 bg-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-white shadow-lg overflow-hidden">
          <img src="https://loremflickr.com/100/100/bird,icon/all" alt="Bird" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-2xl font-bold mb-1 text-emerald-600 font-serif italic">万能 8 点!</h2>
        <p className="text-zinc-500 mb-6 text-sm">请选择接下来的花色</p>
        
        <div className="grid grid-cols-2 gap-4">
          {suits.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelect(suit)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-zinc-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group shadow-sm`}
            >
              <span className={`text-4xl mb-2 ${SUIT_COLORS[suit]}`}>
                {SUIT_SYMBOLS[suit]}
              </span>
              <span className="text-xs uppercase tracking-widest font-bold text-zinc-400 group-hover:text-emerald-600">
                {suit === 'hearts' ? '红桃' : suit === 'diamonds' ? '方块' : suit === 'clubs' ? '梅花' : '黑桃'}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
