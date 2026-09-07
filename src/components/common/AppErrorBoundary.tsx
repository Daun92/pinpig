import { Component, type ErrorInfo, type ReactNode } from 'react';
import { captureError } from '@/services/telemetry';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

/**
 * 렌더링 중 터진 오류를 잡아 빈 화면 대신 복구 버튼을 보여준다.
 * 오류는 telemetry.captureError로 넘긴다 (동의 시에만 외부 전송).
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureError(error, 'react');
    if (import.meta.env.DEV) console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    window.location.replace('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-paper-white flex flex-col items-center justify-center px-8 text-center">
        <p className="text-title text-ink-black mb-2">화면을 그리다 문제가 생겼어요</p>
        <p className="text-body text-ink-mid mb-8">기록은 그대로 있어요. 다시 열면 돌아옵니다</p>
        <button
          onClick={this.handleReload}
          className="w-full max-w-xs py-3 rounded-sm bg-ink-black text-paper-white font-medium"
        >
          다시 열기
        </button>
      </div>
    );
  }
}
