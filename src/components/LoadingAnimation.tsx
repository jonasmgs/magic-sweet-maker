import { useLanguage } from '@/contexts/LanguageContext';

export function LoadingAnimation() {
  const { language, theme } = useLanguage();
  const isMasculine = theme === 'masculine';

  return (
    <div className="w-full max-w-2xl mx-auto animate-pop-in">
      <div className="relative flex flex-col items-center justify-center py-16 space-y-8">
        {/* Magic wand */}
        <div className="relative">
          <div className="text-8xl animate-wand-wave">
            {isMasculine ? '⚡' : '🪄'}
          </div>
          
          {/* Sparkle particles */}
          <div className="absolute inset-0 -m-16">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-sparkle-float"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: `${1.5 + Math.random() * 1}s`,
                }}
              >
                <span className="text-2xl">
                  {['✨', '⭐', '💫', '🌟', '✧', '★'][i % 6]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-3">
          <h3 className={`text-2xl font-display ${
            isMasculine 
              ? 'bg-gradient-to-r from-blue-400 via-purple-500 to-red-500 bg-clip-text text-transparent' 
              : 'text-gradient-candy'
          }`}>
            {language === 'pt' 
              ? (isMasculine ? 'Invocando poderes heróicos...' : 'Criando sua magia doce...') 
              : (isMasculine ? 'Summoning heroic powers...' : 'Creating your sweet magic...')}
          </h3>
          
          {/* Bouncing dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full animate-bounce ${
                  isMasculine 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                    : 'bg-gradient-to-r from-primary to-sweet-purple'
                }`}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>

        {/* Cute floating characters */}
        <div className="flex justify-center gap-4 text-4xl">
          {isMasculine ? (
            <>
              <span className="animate-float" style={{ animationDelay: '0s' }}>🦸</span>
              <span className="animate-float" style={{ animationDelay: '0.3s' }}>💪</span>
              <span className="animate-float" style={{ animationDelay: '0.6s' }}>🔥</span>
            </>
          ) : (
            <>
              <span className="animate-float" style={{ animationDelay: '0s' }}>🧁</span>
              <span className="animate-float" style={{ animationDelay: '0.3s' }}>🍰</span>
              <span className="animate-float" style={{ animationDelay: '0.6s' }}>🍭</span>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-64 h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full animate-progress-bar ${
              isMasculine 
                ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-red-500' 
                : 'bg-gradient-to-r from-primary via-sweet-purple to-sweet-blue'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
