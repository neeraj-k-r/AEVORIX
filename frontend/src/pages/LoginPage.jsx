import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { roles, roleIcons, rolePlaceholders } from '../auth/roles';
import { useToast } from '../components/Toast';

export default function LoginPage({ onLogin }) {
  const { error: showError } = useToast();
  const [selectedRole, setSelectedRole] = useState('Doctor');
  const [email, setEmail] = useState(rolePlaceholders.Doctor);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setEmail(rolePlaceholders[role] || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onLogin({ email, password, role: selectedRole, rememberMe });
      showError('Welcome back!', 'success');
    } catch (err) {
      showError(err.message || 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-card-border shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-lg font-semibold uppercase tracking-wider text-slate-900">
              GATEWAY AUTHENTICATION
            </h1>
            <p className="mt-2 text-sm text-slate-600">Access your secure healthcare workspace</p>
          </div>

          <div className="mb-6" role="tablist" aria-label="Select your role">
            <div className="flex gap-2">
              {roles.map((role) => {
                const Icon = roleIcons[role];
                const isActive = selectedRole === role;
                return (
                  <button
                    key={role}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`${role.toLowerCase()}-panel`}
                    id={`${role.toLowerCase()}-tab`}
                    onClick={() => handleRoleChange(role)}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                    `}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={rolePlaceholders[selectedRole]}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors pr-12"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary/20 focus:ring-2"
                  disabled={isLoading}
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <a
                href="#"
                className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}