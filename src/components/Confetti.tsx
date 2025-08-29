import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfettiProps {
  show: boolean;
  onComplete: () => void;
}

export function Confetti({ show, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<number[]>([]);

  useEffect(() => {
    if (show) {
      setPieces(Array.from({ length: 50 }, (_, i) => i));
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece}
          className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-500 rounded"
          initial={{
            x: Math.random() * window.innerWidth,
            y: -10,
            rotate: 0,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: window.innerHeight + 10,
            rotate: 360,
            x: Math.random() * window.innerWidth,
          }}
          transition={{
            duration: Math.random() * 2 + 1,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}