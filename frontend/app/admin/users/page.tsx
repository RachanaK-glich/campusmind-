'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Shield,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Lock,
  History,
  Activity
} from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import UserManagementTable from '@/components/admin/UserManagementTable';
import { adminApi, UserManagementItem, AuditLogItem } from '@/lib/api';
import { getCurrentUser, isSuperAdmin } from '@/lib/auth';
import { showToast } from '@/components/shared/Toast';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserManagementItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [authorized, setAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'super_admin') {
      showToast('Super Admin privileges required to manage user permissions', 'error');
      router.push('/admin/dashboard');
      return;
    }
    setAuthorized(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, logsData] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getAuditLogs(20),
      ]);
      setUsers(usersData);
      setAuditLogs(logsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch user and audit data', 'error');
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
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Super Admin Authority</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              User Access & Security Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage student & staff privileges, promote administrators, and inspect audit logs.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Users & Logs</span>
          </button>
        </div>

        {/* Users Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span>Registered Accounts ({users.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              <p className="text-xs">Loading users...</p>
            </div>
          ) : (
            <UserManagementTable users={users} onRefresh={fetchData} />
          )}
        </div>

        {/* Security & Audit Logs Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <History className="w-4 h-4 text-indigo-500" />
            <span>Recent Administrative Audit Logs</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-2 px-3">Action</th>
                  <th className="pb-2 px-3">User</th>
                  <th className="pb-2 px-3">Metadata</th>
                  <th className="pb-2 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-400">
                      No administrative actions logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        <span className="font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {log.user_name || log.user_id || 'System'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                        {JSON.stringify(log.metadata_json)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
