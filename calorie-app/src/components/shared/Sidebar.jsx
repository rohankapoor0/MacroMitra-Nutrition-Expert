import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const navItems = [
    { to: '/', label: 'Home', icon: '🏠' },
    { to: '/calculator', label: 'Calculator', icon: '🧮' },
    { to: '/meals', label: 'Meal Plans', icon: '🍱' },
    { to: '/database', label: 'Database', icon: '🇮🇳' },
  ];

  return (
    <aside className="w-64 glass border border-outline-variant/10 flex flex-col fixed top-6 bottom-6 left-6 z-50 overflow-y-auto shadow-ambient rounded-[32px] animate-in slide-in-from-left duration-700">
      <div className="p-10 flex items-center space-x-3 mb-6">
        <span className="text-3xl" role="img" aria-label="salad">🥗</span>
        <h1 className="text-lg font-black text-primary tracking-tighter uppercase leading-none">Macro<br/>Mitra</h1>
      </div>
      
      <nav className="flex-1 px-6 space-y-2">
        {navItems.map((item) => (
          <NavLink 
            key={item.to}
            to={item.to} 
            className={({ isActive }) => 
              `flex items-center space-x-4 px-5 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all group ${
                isActive 
                  ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-green-900/10' 
                  : 'text-on-secondary-container/60 hover:bg-surface-container-low hover:text-on-surface'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-xl group-hover:scale-110 transition-transform ${isActive ? 'brightness-0 invert' : ''}`}>{item.icon}</span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-8">
        <div className="bg-surface-container-low p-5 rounded-2xl">
          <p className="label-tier mb-2">Network</p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-tight text-on-surface">Secure Local Sync</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
