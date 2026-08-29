'use client';

import React from 'react';
import { DollarSign, Clock, Calendar, Briefcase, GraduationCap, Flame } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string, category?: string) => void;
}

const STARTER_QUESTIONS = [
  {
    icon: DollarSign,
    category: 'fees',
    title: 'Tuition Fees & Scholarships',
    query: 'What is the tuition fee for B.Tech Computer Science and what scholarships are available?',
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400',
  },
  {
    icon: Clock,
    category: 'hostel',
    title: 'Hostel Curfew & Mess Rules',
    query: 'What are the hostel curfew timings and what items are strictly prohibited in rooms?',
    color: 'from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400',
  },
  {
    icon: Calendar,
    category: 'exams',
    title: 'Exam Calendar & Attendance',
    query: 'What is the mandatory attendance requirement to sit for end-semester exams?',
    color: 'from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400',
  },
  {
    icon: Briefcase,
    category: 'placements',
    title: 'Campus Placements & Package',
    query: 'What was the highest and average package in the 2026 campus placement report?',
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400',
  },
];

export default function SuggestedQuestions({ onSelectQuestion }: SuggestedQuestionsProps) {
  return (
    <div className="max-w-3xl mx-auto w-full py-8 px-4 text-center space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 text-xs font-semibold border border-brand-200 dark:border-brand-800">
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Grounded College Knowledge Base</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          How can CampusMind assist you today?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Ask any question about admissions, fees, hostel rules, academic dates, or placements. All answers are verified with official document citations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {STARTER_QUESTIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectQuestion(item.query, item.category)}
              className={`p-4 rounded-2xl border bg-gradient-to-br transition-all duration-200 hover:scale-[1.02] hover:shadow-md group text-left ${item.color} bg-white dark:bg-slate-900`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/60 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {item.title}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                "{item.query}"
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
