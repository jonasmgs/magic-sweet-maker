import { useEffect, useState } from 'react';

const decorations = [
  { emoji: '🧁', delay: 0 },
  { emoji: '🍭', delay: 0.5 },
  { emoji: '🍰', delay: 1 },
  { emoji: '🍫', delay: 1.5 },
  { emoji: '🍬', delay: 2 },
  { emoji: '🍩', delay: 0.3 },
  { emoji: '🍪', delay: 1.2 },
  { emoji: '🍓', delay: 0.8 },
  { emoji: '🥛', delay: 1.8 },
  { emoji: '🍦', delay: 0.6 },
];

export function FloatingDecorations() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {decorations.map((item, index) => (
        <div
          key={index}
          className="absolute text-4xl md:text-5xl opacity-20 animate-float select-none"
          style={{
            left: `${(index * 10) + 5}%`,
            top: `${(index * 8) + 10}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${4 + (index % 3)}s`,
          }}
        >
          {item.emoji}
        </div>
      ))}
      {/* Additional decorations on the right side */}
      {decorations.slice(0, 5).map((item, index) => (
        <div
          key={`right-${index}`}
          className="absolute text-3xl md:text-4xl opacity-15 animate-bounce-slow select-none"
          style={{
            right: `${(index * 8) + 3}%`,
            bottom: `${(index * 12) + 15}%`,
            animationDelay: `${item.delay + 1}s`,
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
}
