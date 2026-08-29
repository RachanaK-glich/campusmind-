'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Filter, Zap } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (query: string, category?: string) => void;
  isLoading: boolean;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'admissions', label: 'Admissions' },
  { id: 'fees', label: 'Fees & Scholarships' },
  { id: 'hostel', label: 'Hostel & Mess' },
  { id: 'exams', label: 'Exams & Calendar' },
  { id: 'placements', label: 'Placements & Career' },
];

export default function ChatInput({
  onSendMessage,
  isLoading,
  selectedCategory,
  onCategoryChange,
}: ChatInputProps) {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!query.trim() || isLoading) return;
    onSendMessage(query.trim(), selectedCategory !== 'all' ? selectedCategory : undefined);
    setQuery('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pb-4 space-y-2">
      
      {/* Filter Category Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <div className="flex items-center space-x-1 text-slate-400 pl-1 pr-2 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-semibold text-[11px] hidden sm:inline">Filter:</span>
        </div>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`px-3 py-1 rounded-full text-[11.5px] font-medium transition-all shrink-0 select-none ${
              selectedCategory === cat.id
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Input Box Card */}
      <div className="relative flex items-end bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all p-2">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about college admissions, fees, hostel, exams..."
          rows={1}
          disabled={isLoading}
          className="w-full bg-transparent resize-none outline-none px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 max-h-40 overflow-y-auto leading-relaxed"
        />

        <div className="flex items-center space-x-2 shrink-0 pb-1 pr-1">
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
              query.trim() && !isLoading
                ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/30 scale-100 hover:scale-105 active:scale-95'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
            title="Send query (Enter)"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
        <span className="flex items-center space-x-1">
          <Zap className="w-3 h-3 text-amber-500" />
          <span>Answers grounded exclusively in official college documents</span>
        </span>
        <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
      </div>
    </div>
  );
}
