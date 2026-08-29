'use client';

import React, { useState } from 'react';
import {
  FileText,
  Trash2,
  RefreshCw,
  Download,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Search,
  Layers,
  Calendar
} from 'lucide-react';
import { DocumentItem, documentsApi } from '@/lib/api';
import { showToast } from '../shared/Toast';

interface DocumentListTableProps {
  documents: DocumentItem[];
  onRefresh: () => void;
}

export default function DocumentListTable({ documents, onRefresh }: DocumentListTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.department && doc.department.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will purge all associated vectors from the AI knowledge base.`)) {
      return;
    }

    setActionLoading(id);
    try {
      await documentsApi.deleteDocument(id);
      showToast(`Document "${title}" and its vectors purged`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete document', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReprocess = async (id: string, title: string) => {
    setActionLoading(id);
    try {
      await documentsApi.reprocessDocument(id);
      showToast(`Reprocessed "${title}" successfully`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to reprocess document', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'indexed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Indexed</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Processing</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertOctagon className="w-3 h-3 text-rose-500" />
            <span>Failed</span>
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-4 p-5">
      
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents or department..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-brand-500 capitalize"
          >
            <option value="all">All Categories</option>
            <option value="admissions">Admissions</option>
            <option value="fees">Fees</option>
            <option value="hostel">Hostel</option>
            <option value="exams">Exams</option>
            <option value="placements">Placements</option>
            <option value="policies">Policies</option>
            <option value="other">Other</option>
          </select>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="pb-3 px-3">Document Title</th>
              <th className="pb-3 px-3">Category</th>
              <th className="pb-3 px-3">Department</th>
              <th className="pb-3 px-3">Chunks</th>
              <th className="pb-3 px-3">Status</th>
              <th className="pb-3 px-3">Date</th>
              <th className="pb-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  No documents found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors"
                >
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block truncate max-w-xs font-semibold">{doc.title}</span>
                        <span className="text-[11px] text-slate-400 font-normal">v{doc.version} • {(doc.file_size / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium capitalize">
                      {doc.category}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {doc.department || 'General'}
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-1 font-mono text-slate-700 dark:text-slate-300">
                      <Layers className="w-3.5 h-3.5 text-brand-500" />
                      <span>{doc.chunk_count}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {getStatusBadge(doc.status)}
                  </td>

                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <a
                        href={documentsApi.getDownloadUrl(doc.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Download / View Original File"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => handleReprocess(doc.id, doc.title)}
                        disabled={actionLoading === doc.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Reprocess Vectors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === doc.id ? 'animate-spin' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleDelete(doc.id, doc.title)}
                        disabled={actionLoading === doc.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Document & Purge Vectors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
