import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * iOS 단축어 및 딥링크 URL 파라미터 처리
 *
 * 지원 파라미터:
 * - ?action=add        → /add (지출 작성)
 * - ?action=add-income → /add?type=income (수입 작성)
 * - ?goto=/path        → 해당 경로로 이동
 *
 * iOS 단축어 설정 예시:
 * 1. 단축어 앱 → 새 단축어 → "URL 열기" 액션 추가
 * 2. URL: https://your-domain.com/?action=add
 * 3. Safari에서 열기 선택
 */
export function useDeepLink() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 앱 초기 로드 시에만 실행 (루트 경로에서)
    if (location.pathname !== '/') return;

    const params = new URLSearchParams(window.location.search);

    // action 파라미터 처리
    const action = params.get('action');
    if (action) {
      switch (action) {
        case 'add':
        case 'expense':
          navigate('/add', { replace: true });
          return;
        case 'add-income':
        case 'income':
          navigate('/add?type=income', { replace: true });
          return;
        case 'history':
          navigate('/history', { replace: true });
          return;
        case 'stats':
          navigate('/stats', { replace: true });
          return;
        case 'settings':
          navigate('/settings', { replace: true });
          return;
      }
    }

    // goto 파라미터 처리 (직접 경로 지정)
    const goto = params.get('goto');
    if (goto && goto.startsWith('/')) {
      navigate(goto, { replace: true });
      return;
    }

    // URL에서 파라미터 제거 (클린 URL 유지)
    if (params.toString()) {
      window.history.replaceState({}, '', '/');
    }
  }, []);
}
