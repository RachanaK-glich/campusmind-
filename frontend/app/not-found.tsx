import React from 'react';
import Link from 'next/link';
import { HelpCircle, MessageSquare, Home, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-6">
          
          <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/20">
            <HelpCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              404 — Page Not Found
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The page or document reference you are looking for does not exist in the CampusMind repository.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center space-x-2 transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </Link>

            <Link
              href="/chat"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-md shadow-brand-500/25 flex items-center justify-center space-x-2 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask AI Chatbot</span>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
