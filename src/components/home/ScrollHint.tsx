/**
 * ScrollHint - 스크롤 유도 힌트
 *
 * 첫 화면 하단에 표시되어 아래로 스크롤하면
 * 더 많은 콘텐츠가 있음을 암시합니다.
 */

import { ChevronDown } from 'lucide-react';

interface ScrollHintProps {
  label?: string;
}

export function ScrollHint({ label = '오늘' }: ScrollHintProps) {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <span className="text-caption text-ink-light">{label}</span>
      <ChevronDown
        size={20}
        className="text-ink-light animate-bounce"
        style={{ animationDuration: '2s' }}
      />
    </div>
  );
}
