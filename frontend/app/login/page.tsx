'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  ShieldCheck,
  User,
  Shield,
  Key
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { setAuthSession } from '@/lib/auth';
import { showToast } from '@/components/shared/Toast';
import Navbar from '@/components/shared/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const authData = await authApi.login(email.trim(), password);
      setAuthSession(authData);
      showToast(`Welcome back, ${authData.user.name}!`, 'success');

      if (authData.user.role === 'admin' || authData.user.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/chat');
      }
    } catch (err: any) {
      showToast(err.message || 'Invalid credentials. Please check your email/password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        {/* Background ambient light */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 dark:bg-brand-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-md w-full space-y-6 relative z-10">
          
          {/* Card */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-7 sm:p-9 shadow-xl space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-500/25">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Sign in to CampusMind
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Access verified institutional Q&A, chat history, and document management
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@campusmind.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md shadow-brand-500/25 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span>Quick Demo Accounts:</span>
                <Key className="w-3.5 h-3.5 text-brand-500" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('student@campusmind.edu', 'Password123!')}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-medium transition-all text-center flex flex-col items-center space-y-1 group"
                >
                  <User className="w-3.5 h-3.5 text-brand-500" />
                  <span className="text-[11px] font-bold">Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin@campusmind.edu', 'Password123!')}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-medium transition-all text-center flex flex-col items-center space-y-1 group"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[11px] font-bold">Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('superadmin@campusmind.edu', 'Password123!')}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-medium transition-all text-center flex flex-col items-center space-y-1 group"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-[11px] font-bold">Super Admin</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link href="/signup" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
                Sign up as Student
              </Link>
            </p>

          </div>

        </div>
      </div>
    </div>
  );
}
