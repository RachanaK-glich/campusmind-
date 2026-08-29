'use client';

import React, { useState } from 'react';
import { Users, Shield, ShieldCheck, UserCheck, Search, RefreshCw } from 'lucide-react';
import { UserManagementItem, adminApi } from '@/lib/api';
import { isSuperAdmin } from '@/lib/auth';
import { showToast } from '../shared/Toast';

interface UserManagementTableProps {
  users: UserManagementItem[];
  onRefresh: () => void;
}

export default function UserManagementTable({ users, onRefresh }: UserManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const canManageRoles = isSuperAdmin();

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      await adminApi.updateUserRole(userId, newRole);
      showToast(`Updated user role to ${newRole}`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user role', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <ShieldCheck className="w-3 h-3 text-purple-500" />
            <span>Super Admin</span>
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            <Shield className="w-3 h-3 text-indigo-500" />
            <span>Admin</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <UserCheck className="w-3 h-3 text-slate-500" />
            <span>Student</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-4 p-5">
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-brand-500"
          />
        </div>

        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors self-end sm:self-auto"
          title="Refresh user list"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="pb-3 px-3">User</th>
              <th className="pb-3 px-3">Role</th>
              <th className="pb-3 px-3">Conversations</th>
              <th className="pb-3 px-3">Uploads</th>
              <th className="pb-3 px-3">Joined Date</th>
              <th className="pb-3 px-3 text-right">Role Management</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors">
                  
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">{u.name}</span>
                        <span className="text-[11px] text-slate-400 font-normal">{u.email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {getRoleBadge(u.role)}
                  </td>

                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono">
                    {u.conversation_count}
                  </td>

                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono">
                    {u.document_count}
                  </td>

                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-3 text-right">
                    {canManageRoles ? (
                      <select
                        value={u.role}
                        disabled={updatingUserId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-brand-500 cursor-pointer"
                      >
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Super Admin only</span>
                    )}
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
