import { useState, useEffect, useMemo } from 'react';

const LOADING_MESSAGES = [
  // 🐷 돼지 테마
  "꿀꿀~ 일어나는 중...",
  "저금통을 흔드는 중...",
  "핀피그가 깨어나는 중...",
  "코를 킁킁...",
  "도토리를 세는 중...",

  // 💰 돈/예산 테마
  "남은 예산을 계산하는 중",
  "동전을 세는 중...",
  "지갑 속을 들여다보는 중...",
  "숫자들을 불러모으는 중...",

  // 🪞 거울 테마 (앱 컨셉)
  "오늘의 모습을 비추는 중...",
  "숫자는 팩트일 뿐이에요",
  "있는 그대로 보여드릴게요",

  // ☀️ 일상/인사 테마
  "오늘 하루도 잘 지내고 있나요?",
  "오늘도 담담하게",
  "좋은 하루 되세요",

  // 🔧 기술적 유머
  "픽셀을 정렬하는 중...",
  "0과 1을 정돈하는 중...",
  "데이터를 꺼내오는 중...",
];

export function SplashScreen() {
  const [dotCount, setDotCount] = useState(1);

  // Pick a random message once on mount
  const message = useMemo(() => {
    const index = Math.floor(Math.random() * LOADING_MESSAGES.length);
    return LOADING_MESSAGES[index];
  }, []);

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-paper-white">
      {/* Pig Icon - using favicon */}
      <div className="mb-8 animate-bounce-gentle">
        <img
          src="/favicon.svg"
          alt="PinPig"
          width="80"
          height="80"
          className="drop-shadow-sm"
        />
      </div>

      {/* Random message */}
      <p className="text-ink-mid text-sm mb-4 text-center px-8">
        {message}
      </p>

      {/* Loading dots */}
      <div className="flex gap-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              i <= dotCount ? 'bg-ink-black' : 'bg-ink-faint'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
