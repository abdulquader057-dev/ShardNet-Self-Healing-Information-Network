import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Shield, QrCode, Inbox, Database, Share2, Settings, Hash, BookOpen } from 'lucide-react';

const navItems = [
  { to: '/',        icon: Shield,    label: 'Home'  },
  { to: '/forum',   icon: Hash,      label: 'Forum' },
  { to: '/sos-book',icon: BookOpen,  label: 'SOS Book'},
  { to: '/scan',    icon: QrCode,    label: 'Link'  },
  { to: '/pulse',   icon: Share2,    label: 'Pulse' },
  { to: '/inbox',   icon: Inbox,     label: 'Inbox' },
  { to: '/storage', icon: Database,  label: 'Vault' },
  { to: '/settings', icon: Settings, label: 'Config' },
];

const Navbar = () => {
  const location = useLocation();
  // Hide bottom nav on specific screens if needed (e.g. Evidence Capture)
  if (location.pathname === '/evidence') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] h-20 bg-[#0A0A0F]/90 backdrop-blur border-t border-[#2A2A35] safe-area-bottom">
      <div className="flex items-center h-full overflow-x-auto scroll-smooth no-scrollbar px-2 max-w-[800px] mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `
              flex flex-col items-center justify-center gap-1 min-w-[64px] h-full flex-1 transition-all duration-300
              ${isActive ? 'text-[#3B82F6]' : 'text-[#8B8B9A] hover:text-white'}
            `}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(50);
            }}
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-[#3B82F6]/10' : ''}`}>
                  <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[14px] font-bold uppercase tracking-wider">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;

