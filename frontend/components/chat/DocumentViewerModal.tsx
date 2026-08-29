'use client';

import React from 'react';
import { X, FileText, Download, BookmarkCheck, Building2, Tag } from 'lucide-react';
import { SourceReference, documentsApi } from '@/lib/api';

interface DocumentViewerModalProps {
  source: SourceReference | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentViewerModal({ source, isOpen, onClose }: DocumentViewerModalProps) {
  if (!isOpen || !source) return null;

  const downloadUrl = documentsApi.getDownloadUrl(source.document_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                {source.document_title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official Institutional Record • Cited at Page {source.page}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              <Building2 className="w-3.5 h-3.5 text-brand-500" />
              <span>Department: {source.department || 'General Academic Branch'}</span>
            </span>

            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span className="capitalize">Category: {source.category || 'Documentation'}</span>
            </span>

            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800">
              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Grounded Page {source.page}</span>
            </span>
          </div>

          {/* Cited Excerpt Box */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Indexed Grounding Snippet (Page {source.page})
            </h4>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap selection:bg-brand-500 selection:text-white">
              {source.snippet}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 text-xs text-brand-900 dark:text-brand-200 flex items-start space-x-2.5">
            <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
            <p>
              CampusMind retrieved this snippet directly from the verified institutional record stored in the vector database. Responses are generated strictly adhering to this content.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Vector Similarity Score: <span className="font-semibold text-slate-700 dark:text-slate-300">{(source.score * 100).toFixed(1)}%</span>
          </span>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Original File</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
