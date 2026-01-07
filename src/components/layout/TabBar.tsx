import { NavLink } from 'react-router-dom';
import { Home, List, BarChart2, Settings, Plus } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: '홈' },
  { to: '/history', icon: List, label: '내역' },
  { to: '/add', icon: Plus, label: '추가', isMain: true },
  { to: '/stats', icon: BarChart2, label: '리포트' },
  { to: '/settings', icon: Settings, label: '설정' },
];

export function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-paper-white border-t border-paper-mid safe-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label, isMain }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-touch min-h-touch ${
                isMain
                  ? 'relative -mt-4'
                  : isActive
                    ? 'text-ink-black'
                    : 'text-ink-light'
              }`
            }
          >
            {isMain ? (
              <div className="w-14 h-14 bg-ink-black rounded-full flex items-center justify-center shadow-lg">
                <Icon className="w-6 h-6 text-paper-white" />
              </div>
            ) : (
              <>
                <Icon className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-caption mt-1">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
