import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, QrCode, Inbox, Database, Share2, HelpCircle } from 'lucide-react';

const navItems = [
  { to: '/',        icon: Shield,    label: 'Home'  },
  { to: '/scan',    icon: QrCode,    label: 'Scan'  },
  { to: '/pulse',   icon: Share2,    label: 'Pulse' },
  { to: '/inbox',   icon: Inbox,     label: 'Inbox' },
  { to: '/storage', icon: Database,  label: 'Vault' },
  { to: '/help',    icon: HelpCircle,label: 'Help'  },
];

const Navbar = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none flex justify-center pb-6">
    <div className="mx-4 w-full max-w-[500px] pointer-events-auto glass-premium rounded-[2rem] flex items-center justify-around p-2 border-white/10">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `
            flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all duration-300
            ${isActive ? 'bg-primary/20 text-primary scale-105 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-slate-500 hover:text-slate-300'}
          `}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(50);
          }}
        >
          {({ isActive }) => (
            <>
              <Icon size={isActive ? 20 : 18} />
              <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${isActive ? 'text-primary' : 'text-slate-500'}`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default Navbar;
