import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Sparkle, Layers, Waves, SlidersHorizontal, Plus, Check } from 'lucide-react';
import { useAddPageStore } from '@/stores/addPageStore';

const tabs = [
  { to: '/', icon: Sparkle, label: '오늘' },
  { to: '/history', icon: Layers, label: '기록' },
  { to: '/add', icon: Plus, label: '추가', isMain: true },
  { to: '/stats', icon: Waves, label: '흐름' },
  { to: '/settings', icon: SlidersHorizontal, label: '설정' },
];

export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canSubmit, triggerSubmit } = useAddPageStore();

  const isOnAddPage = location.pathname === '/add';

  const handleMainButtonClick = async (e: React.MouseEvent) => {
    if (isOnAddPage && canSubmit) {
      e.preventDefault();
      await triggerSubmit();
    } else if (!isOnAddPage) {
      navigate('/add');
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-paper-white border-t border-paper-mid safe-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label, isMain }) => {
          if (isMain) {
            const showCheck = isOnAddPage && canSubmit;
            return (
              <button
                key={to}
                onClick={handleMainButtonClick}
                className="flex flex-col items-center justify-center min-w-touch min-h-touch relative -mt-4"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                    showCheck ? 'bg-ink-black' : isOnAddPage ? 'bg-paper-mid' : 'bg-ink-black'
                  }`}
                >
                  {showCheck ? (
                    <Check className="w-6 h-6 text-paper-white" />
                  ) : (
                    <Plus className="w-6 h-6 text-paper-white" />
                  )}
                </div>
              </button>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
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
