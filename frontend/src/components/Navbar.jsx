import { Shield, Circle } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="w-full bg-white border-b border-card-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-primary" />
            <span className="ml-2 text-xl font-bold uppercase tracking-wide text-slate-900">AEVORIX</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-verification-bg">
              <Circle className="w-2 h-2 text-verification-text fill-current" />
              <span className="text-sm font-medium text-verification-text">Ledger Connected</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}