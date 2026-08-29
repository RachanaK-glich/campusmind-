'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Files,
  Users,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import { adminApi, AnalyticsOverview } from '@/lib/api';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { showToast } from '@/components/shared/Toast';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authorized, setAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || (!isAdmin() && user.role !== 'super_admin')) {
      showToast('Admin privileges required. Please log in with an admin account.', 'error');
      router.push('/login');
      return;
    }
    setAuthorized(true);
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Knowledge Base Analytics & System Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Monitor retrieval performance, student inquiry trends, and knowledge coverage.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>

            <Link
              href="/admin/documents"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-sm shadow-brand-500/25 transition-all hover:scale-[1.02]"
            >
              <Files className="w-3.5 h-3.5" />
              <span>Manage Documents</span>
            </Link>
          </div>
        </div>

        {/* Content Body */}
        {loading && !analytics ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <p className="text-xs">Computing real-time knowledge base analytics...</p>
          </div>
        ) : analytics ? (
          <AnalyticsCharts analytics={analytics} />
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <AlertCircle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
            <p className="text-sm font-semibold">Unable to fetch analytics at this moment.</p>
          </div>
        )}

      </main>
    </div>
  );
}
