import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SmileyDoodle, HandLineArt, SparkleDoodle } from './Doodles';

interface CardData {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  bg: string;
  tag: string;
  artType: 'ily' | 'hello' | 'help';
}

const CARDS: CardData[] = [
  {
    id: 'tests',
    num: '01',
    title: 'Tests & Recognition',
    subtitle: 'Practice gestures and evaluate landmark precision in real-time.',
    bg: '#CDEFD4', // Soft mint
    tag: 'MediaPipe 553 Points',
    artType: 'ily',
  },
  {
    id: 'multilingual',
    num: '02',
    title: 'Three Sign Languages',
    subtitle: 'Indian (ISL), British (BSL), and American (ASL) distinct grammars.',
    bg: '#F8CFD0', // Blush pink
    tag: 'ISL · BSL · ASL',
    artType: 'help',
  },
  {
    id: 'dictionary',
    num: '03',
    title: 'Common Words',
    subtitle: 'Illustrated dictionary of essential everyday signs & fingerspelling.',
    bg: '#C8E9F7', // Baby blue
    tag: 'Fingerspelling & Lexicon',
    artType: 'hello',
  },
  {
    id: 'gemma',
    num: '04',
    title: 'Gemma 4 Orchestration',
    subtitle: 'Contextual sentence refinement running locally through Ollama.',
    bg: '#F9E9B7', // Butter yellow
    tag: 'Local On-Device AI',
    artType: 'ily',
  },
];

export const HeroCardStack: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[4/5] sm:aspect-[3/4] flex items-center justify-center select-none">
      {/* Decorative Floating Smiley Sticker */}
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-6 -right-4 z-40 cursor-pointer"
        title="Welcome to iNSIGHT!"
      >
        <SmileyDoodle className="w-14 h-14" />
      </motion.div>

      {/* Floating Sparkle Sticker */}
      <div className="absolute -bottom-4 -left-6 z-40">
        <SparkleDoodle className="w-9 h-9" />
      </div>

      {/* Overlapping Cards */}
      <div className="relative w-64 sm:w-72 h-[340px] sm:h-[380px]">
        {CARDS.map((card, index) => {
          // Calculate stack offset relative to active card
          const order = (index - activeIndex + CARDS.length) % CARDS.length;
          const isTop = order === 0;

          // Staggered fan angles and offsets
          const rotate = order * 4 - 2;
          const xOffset = order * 18;
          const yOffset = order * 10;
          const zIndex = 30 - order;

          return (
            <motion.div
              key={card.id}
              layout
              initial={false}
              animate={{
                x: xOffset,
                y: yOffset,
                rotate: rotate,
                scale: 1 - order * 0.03,
              }}
              whileHover={isTop ? { y: yOffset - 8, scale: 1.02 } : { y: yOffset - 4 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              onClick={() => setActiveIndex(index)}
              style={{
                backgroundColor: card.bg,
                zIndex: zIndex,
              }}
              className="absolute inset-0 rounded-[22px] border-2 border-charcoal p-5 flex flex-col justify-between cursor-pointer shadow-hard transition-shadow"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b-2 border-charcoal">
                  <span className="text-xl font-black font-display text-charcoal tracking-tight">
                    {card.num}
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white/70 px-2 py-0.5 rounded-full border border-charcoal">
                    {card.tag}
                  </span>
                </div>

                {/* Vector Line Art Gesture */}
                <div className="py-3 flex justify-center">
                  <HandLineArt type={card.artType} className="w-28 h-28" />
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t-2 border-charcoal/40">
                <h4 className="text-base font-bold text-charcoal leading-tight">
                  {card.title}
                </h4>
                <p className="text-xs text-charcoal/80 mt-1 line-clamp-2">
                  {card.subtitle}
                </p>
                <div className="flex justify-between items-center mt-3 text-[10px] font-mono font-semibold text-charcoal/60">
                  <span>Click to view</span>
                  <span className="font-bold underline text-charcoal">Tap card</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
