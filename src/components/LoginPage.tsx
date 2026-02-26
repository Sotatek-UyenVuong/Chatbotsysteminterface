import { useState } from 'react';
import { Mail, Lock, LogIn, Eye, EyeOff, Sparkles, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    // Simulate login API call
    setTimeout(() => {
      setIsLoading(false);
      
      // Demo: Accept any valid email with password length >= 6
      toast.success('🌿 Welcome back!');
      onLogin(email, password);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7A9150] via-[#72C16B] to-[#E8F0A5] flex items-center justify-center p-6">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#72C16B] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-32 right-20 w-40 h-40 bg-[#7FE0EE] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-36 h-36 bg-[#E8F0A5] rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#72C16B] to-[#7FE0EE] rounded-3xl shadow-2xl mb-4 animate-pulse">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-white mb-2">Document Chatbot System 🌿</h1>
          <p className="text-[#E8F0A5]">Sign in to manage your documents</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#424F42] rounded-3xl shadow-2xl p-8 border border-[rgba(101,104,89,0.4)] backdrop-blur-md">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-white mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#72C16B]">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="your.email@gmail.com"
                  className="w-full pl-12 pr-4 py-3 bg-[#656859] border border-[rgba(101,104,89,0.3)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#72C16B] focus:border-transparent text-white placeholder-[#99BD98] transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-white mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#72C16B]">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 bg-[#656859] border border-[rgba(101,104,89,0.3)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#72C16B] focus:border-transparent text-white placeholder-[#99BD98] transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#99BD98] hover:text-[#72C16B] transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[rgba(101,104,89,0.3)] bg-[#656859] text-[#72C16B] focus:ring-2 focus:ring-[#72C16B] focus:ring-offset-0"
                />
                <span className="text-[#E8F0A5]">Remember me</span>
              </label>
              <button
                type="button"
                className="text-[#7FE0EE] hover:text-[#E8F0A5] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-[#72C16B] to-[#7FE0EE] text-white rounded-2xl hover:from-[#7FE0EE] hover:to-[#72C16B] hover:scale-105 hover:shadow-2xl hover:shadow-[#72C16B]/50 transition-all duration-300 flex items-center justify-center gap-2 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(101,104,89,0.3)]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[#424F42] text-[#99BD98]">or</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-[#E8F0A5]">
              Don't have an account?{' '}
              <button className="text-[#7FE0EE] hover:text-[#E8F0A5] transition-colors">
                Sign up
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[#E8F0A5]">
            Demo: Use any valid email with password (6+ characters)
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#424F42] rounded-xl flex items-center justify-center mx-auto mb-2 border border-[rgba(101,104,89,0.3)]">
              <FileText className="w-6 h-6 text-[#72C16B]" />
            </div>
            <p className="text-[#E8F0A5] text-sm">Upload Docs</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#424F42] rounded-xl flex items-center justify-center mx-auto mb-2 border border-[rgba(101,104,89,0.3)]">
              <Sparkles className="w-6 h-6 text-[#7FE0EE]" />
            </div>
            <p className="text-[#E8F0A5] text-sm">AI Chatbot</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#424F42] rounded-xl flex items-center justify-center mx-auto mb-2 border border-[rgba(101,104,89,0.3)]">
              <Mail className="w-6 h-6 text-[#E8F0A5]" />
            </div>
            <p className="text-[#E8F0A5] text-sm">Secure</p>
          </div>
        </div>
      </div>
    </div>
  );
}
