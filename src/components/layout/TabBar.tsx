import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { PiggyBank, ClipboardList, PieChart, Settings, Plus, Check } from 'lucide-react';
import { useFabStore } from '@/stores/fabStore';

const tabs = [
  { to: '/', icon: PiggyBank, label: '오늘' },
  { to: '/history', icon: ClipboardList, label: '기록' },
  { to: '/add', icon: Plus, label: '추가', isMain: true },
  { to: '/stats', icon: PieChart, label: '분석' },
  { to: '/settings', icon: Settings, label: '설정' },
];

// FAB가 체크 버튼으로 동작하는 페이지 패턴들
const FAB_SUBMIT_PATTERNS = [
  '/add',
  '/transaction/*',
  '/settings/categories/new',
  '/settings/categories/*/edit',
  '/settings/payment-methods/new',
  '/settings/payment-methods/*/edit',
  '/settings/recurring/new',
  '/settings/recurring/*/edit',
];

// FAB 버튼을 숨기는 관리 페이지들 (목록 화면)
const FAB_HIDDEN_PATTERNS = [
  '/settings/recurring',
  '/settings/categories',
  '/settings/methods',
];

// 경로가 패턴과 매칭되는지 확인
const matchesPattern = (pathname: string, pattern: string): boolean => {
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace('*', '[^/]+') + '$');
    return regex.test(pathname);
  }
  return pathname === pattern;
};

export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canSubmit, isVisible, triggerSubmit } = useFabStore();

  const isOnSubmitPage = FAB_SUBMIT_PATTERNS.some(pattern =>
    matchesPattern(location.pathname, pattern)
  );
  const isOnHiddenPage = FAB_HIDDEN_PATTERNS.some(pattern =>
    location.pathname === pattern
  );
  const showCheckButton = isOnSubmitPage && canSubmit;

  const handleMainButtonClick = async (e: React.MouseEvent) => {
    if (showCheckButton) {
      e.preventDefault();
      await triggerSubmit();
    } else if (!isOnSubmitPage) {
      navigate('/add');
    }
  };

  return (
    <nav className="flex-shrink-0 bg-paper-white border-t border-paper-mid safe-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label, isMain }) => {
          if (isMain) {
            // FAB가 보이지 않을 때는 빈 공간 유지
            if (!isVisible) {
              return <div key={to} className="min-w-touch min-h-touch" />;
            }

            // 관리 화면이거나 submit 페이지에서 아직 입력이 안 됐을 때 비활성화
            const isDisabled = isOnHiddenPage || (isOnSubmitPage && !canSubmit);

            return (
              <button
                key={to}
                onClick={handleMainButtonClick}
                disabled={isDisabled}
                className="flex flex-col items-center justify-center min-w-touch min-h-touch relative -mt-4 z-[70]"
                data-tour="add-confirm"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                    isDisabled
                      ? 'bg-paper-mid'
                      : 'bg-ink-black'
                  }`}
                >
                  {showCheckButton ? (
                    <Check className="w-6 h-6 text-paper-white" />
                  ) : (
                    <Plus className={`w-6 h-6 ${isDisabled ? 'text-ink-light' : 'text-paper-white'}`} />
                  )}
                </div>
              </button>
            );
          }

          const handleTabClick = () => {
            // 탭 이동 시 메인 콘텐츠 영역을 최상단으로 스크롤
            const mainContent = document.querySelector('main');
            if (mainContent) {
              mainContent.scrollTo({ top: 0, behavior: 'instant' });
            }
          };

          return (
            <NavLink
              key={to}
              to={to}
              onClick={handleTabClick}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-touch min-h-touch ${
                  isActive ? 'text-ink-black' : 'text-ink-light'
                }`
              }
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-caption mt-1">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
