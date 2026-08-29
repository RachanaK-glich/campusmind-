'use client';

import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, ExternalLink, Award } from 'lucide-react';
import { SourceReference } from '@/lib/api';

interface SourceCardProps {
  source: SourceReference;
  onViewDocument?: (source: SourceReference) => void;
}

export default function SourceCard({ source, onViewDocument }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getScoreBadge = (score: number) => {
    if (score >= 0.70) {
      return (
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          High Match ({Math.round(score * 100)}%)
        </span>
      );
    } else if (score >= 0.45) {
      return (
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
          Match ({Math.round(score * 100)}%)
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
          Relevance ({Math.round(score * 100)}%)
        </span>
      );
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 hover:border-brand-300 dark:hover:border-brand-800 transition-all overflow-hidden text-xs">
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 select-none"
      >
        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
          <div className="w-6 h-6 rounded-md bg-brand-100 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
              {source.document_title}
            </span>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Page {source.page}</span>
              {source.category && (
                <>
                  <span>•</span>
                  <span className="capitalize">{source.category}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {getScoreBadge(source.score)}
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 space-y-2.5">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-mono text-[11.5px] bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
            "{source.snippet}"
          </p>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              Department: <span className="text-slate-600 dark:text-slate-300 font-medium">{source.department || 'General Records'}</span>
            </span>

            {onViewDocument && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDocument(source);
                }}
                className="flex items-center space-x-1 text-brand-600 dark:text-brand-400 hover:underline font-semibold text-[11px]"
              >
                <span>View Full Page Context</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
