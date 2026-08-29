'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Mail,
  Shield,
  Calendar,
  LogOut,
  MessageSquare,
  LayoutDashboard,
  CheckCircle2,
  Lock,
  Key
} from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { getCurrentUser, clearAuthSession, UserProfile } from '@/lib/auth';
import { showToast } from '@/components/shared/Toast';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    showToast('Logged out successfully', 'info');
    router.push('/login');
  };

  if (!user) return null;

  const isRoleAdmin = user.role === 'admin' || user.role === 'super_admin';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-brand-500/25 uppercase">
              {user.name.charAt(0)}
            </div>

            <div className="text-center sm:text-left space-y-1 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {user.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 self-center sm:self-auto">
                  {user.role}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* User Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Account ID
              </span>
              <p className="font-mono text-slate-700 dark:text-slate-300 truncate">{user.id}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Joined Date
              </span>
              <p className="text-slate-700 dark:text-slate-300">
                {new Date(user.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Authentication Status
              </span>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>JWT Stateless Bearer Session Active</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Permissions Level
              </span>
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                {isRoleAdmin
                  ? 'Full Document Upload, Reprocessing & Analytics Access'
                  : 'Student Q&A, Conversation History & Feedback'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-3">
            <Link
              href="/chat"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Go to Chat Assistant</span>
            </Link>

            {isRoleAdmin && (
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Open Admin Dashboard</span>
              </Link>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
