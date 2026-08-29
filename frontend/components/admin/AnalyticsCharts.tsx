'use client';

import React from 'react';
import {
  FileText,
  Layers,
  MessageSquare,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Activity,
  Award
} from 'lucide-react';
import { AnalyticsOverview } from '@/lib/api';

interface AnalyticsChartsProps {
  analytics: AnalyticsOverview;
}

export default function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  const categories = Object.entries(analytics.category_distribution || {});
  const maxCategoryCount = Math.max(...categories.map(([_, count]) => count), 1);

  return (
    <div className="space-y-6">
      
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Indexed Documents */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Documents
            </span>
            <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {analytics.total_documents}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({analytics.total_chunks} vector chunks)
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>Active Knowledge Base</span>
          </p>
        </div>

        {/* Card 2: Student Queries */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Student Queries
            </span>
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {analytics.total_queries}
            </span>
            <span className="text-xs text-slate-500">
              across {analytics.total_conversations} chats
            </span>
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center space-x-1">
            <Activity className="w-3 h-3" />
            <span>Real-time RAG Pipeline</span>
          </p>
        </div>

        {/* Card 3: Satisfaction Score */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Satisfaction Rate
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {analytics.satisfaction_rate_percentage}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({analytics.positive_feedback_count} 👍 / {analytics.negative_feedback_count} 👎)
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
            <Award className="w-3 h-3" />
            <span>Verified Source Accuracy</span>
          </p>
        </div>

        {/* Card 4: Unanswered Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Unanswered Rate
            </span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {analytics.unanswered_rate_percentage}%
            </span>
            <span className="text-xs text-slate-500">
              ({analytics.unanswered_queries} fallback alerts)
            </span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
            Strict Hallucination Prevention
          </p>
        </div>

      </div>

      {/* Category Breakdown & Popular Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Knowledge Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-brand-500" />
            <span>Knowledge Base Coverage by Category</span>
          </h4>

          <div className="space-y-3 pt-2">
            {categories.length === 0 ? (
              <p className="text-xs text-slate-400">No documents indexed yet.</p>
            ) : (
              categories.map(([cat, count]) => {
                const percentage = Math.round((count / maxCategoryCount) * 100);
                return (
                  <div key={cat} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="capitalize text-slate-700 dark:text-slate-300">{cat}</span>
                      <span className="text-slate-500">{count} documents</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Sample Queries */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Frequent Student Queries</span>
          </h4>

          <div className="space-y-2.5 pt-2">
            {analytics.top_queries?.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-sm">
                  "{item.query}"
                </span>
                <span className="px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold text-[11px] shrink-0 ml-2">
                  {item.count} queries
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
