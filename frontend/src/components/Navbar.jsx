import { useAuth } from '../contexts/AuthContext';
import { Shield, Circle, Users, LayoutDashboard, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/patients', label: 'Patients', icon: Users },
  ];

  return (
    <header className="w-full bg-white border-b border-card-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-primary" />
              <span className="ml-2 text-xl font-bold uppercase tracking-wide text-slate-900">AEVORIX</span>
            </div>
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-verification-bg">
              <Circle className="w-2 h-2 text-verification-text fill-current animate-pulse" />
              <span className="text-sm font-medium text-verification-text">Ledger Connected</span>
            </div>
            <div className="hidden sm:block text-sm text-slate-600">
              {user?.full_name} <span className="text-primary">({user?.role})</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}