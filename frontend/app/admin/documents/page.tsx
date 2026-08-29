'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Files,
  UploadCloud,
  Layers,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Database
} from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import DocumentUploader from '@/components/admin/DocumentUploader';
import DocumentListTable from '@/components/admin/DocumentListTable';
import { documentsApi, DocumentItem } from '@/lib/api';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { showToast } from '@/components/shared/Toast';

export default function AdminDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [authorized, setAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || (!isAdmin() && user.role !== 'super_admin')) {
      showToast('Admin privileges required to manage college documents', 'error');
      router.push('/login');
      return;
    }
    setAuthorized(true);
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentsApi.getDocuments();
      setDocuments(data.items || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch indexed documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
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
            <div className="flex items-center space-x-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
              <Files className="w-4 h-4" />
              <span>Document Repository</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Institutional Document Management & Vector Ingestion
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Upload official brochures, fee circulars, and notices to automatically chunk, embed, and index them into Qdrant.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchDocuments}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Index</span>
            </button>
          </div>
        </div>

        {/* Uploader Section */}
        <DocumentUploader onUploadSuccess={handleUploadSuccess} />

        {/* Documents Table Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-brand-500" />
              <span>Indexed College Records ({documents.length})</span>
            </h2>
            <span className="text-xs text-slate-400">
              Total Chunks: {documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0)}
            </span>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              <p className="text-xs">Loading documents...</p>
            </div>
          ) : (
            <DocumentListTable documents={documents} onRefresh={fetchDocuments} />
          )}
        </div>

      </main>
    </div>
  );
}
