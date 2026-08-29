'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  Search,
  Zap,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
  HelpCircle,
  Clock,
  Award,
  ChevronRight,
  Database,
  Lock,
  Cpu
} from 'lucide-react';
import Navbar from '@/components/shared/Navbar';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');

  const categories = [
    {
      title: 'Admissions 2026',
      desc: 'Eligibility criteria, JEE/SAT cutoff ranks, seat intake, and quota guidelines.',
      icon: GraduationCap,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-500 border-blue-500/30',
      badge: 'Admissions Brochure'
    },
    {
      title: 'Fees & Scholarships',
      desc: 'Annual tuition slabs, merit-cum-means waivers, hostel security deposits.',
      icon: Award,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500 border-emerald-500/30',
      badge: 'Fee Circular'
    },
    {
      title: 'Hostel & Mess Rules',
      desc: 'Curfew timings, leave applications, room amenities, and mess menu schedules.',
      icon: Clock,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-500 border-amber-500/30',
      badge: 'Hostel Handbook'
    },
    {
      title: 'Exams & Academic Calendar',
      desc: '75% attendance policy, mid-term / end-term schedules, re-evaluation steps.',
      icon: BookOpen,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-500 border-purple-500/30',
      badge: 'Academic Ordinance'
    },
    {
      title: 'Placements & Internships',
      desc: 'Highest & average packages, eligibility criteria, top recruiting companies.',
      icon: Zap,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-500 border-cyan-500/30',
      badge: 'Placement Report'
    },
    {
      title: 'Campus Policies',
      desc: 'Anti-ragging guidelines, library borrowing terms, and IT acceptable use policies.',
      icon: ShieldCheck,
      color: 'from-rose-500/20 to-pink-500/20 text-rose-500 border-rose-500/30',
      badge: 'Policy Document'
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200 dark:border-slate-850">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-500/15 dark:bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[250px] bg-indigo-500/10 dark:bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800 text-xs font-semibold text-brand-700 dark:text-brand-300 shadow-sm animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-ping" />
              <span>Next-Gen RAG Architecture • Strict Zero-Hallucination Policy</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Instant, Source-Cited Answers from <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 via-indigo-500 to-cyan-500">
                Official College Records
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              No more digging through 80-page PDFs and outdated notice boards. CampusMind indexes institutional brochures, circulars, and handbooks to deliver factual answers with verified page citations.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/chat"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-base shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center space-x-2"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Ask CampusMind Now</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>

              <Link
                href="/admin/documents"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold text-base border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-brand-300 dark:hover:border-brand-700 transition-all flex items-center justify-center space-x-2"
              >
                <Database className="w-5 h-5 text-brand-500" />
                <span>Admin Knowledge Hub</span>
              </Link>
            </div>

            {/* Feature Badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Page-by-page Source Grounding</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Refuses to Fabricate Answers</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Sub-second Vector Search</span>
              </div>
            </div>

          </div>

          {/* Interactive Chat Simulation Card */}
          <div className="mt-14 max-w-3xl mx-auto bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/85 shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-5">
            
            {/* Window header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400 font-mono ml-2">live-rag-query-preview</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-300 dark:border-emerald-800">
                100% Grounded
              </span>
            </div>

            {/* User Message */}
            <div className="flex items-start justify-end space-x-3">
              <div className="bg-brand-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm font-medium shadow-sm max-w-lg">
                What is the minimum eligibility criteria and last application date for B.Tech Computer Science?
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                U
              </div>
            </div>

            {/* Assistant Response */}
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-brand-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-3 flex-1 max-w-xl">
                <div className="bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm p-4 text-sm space-y-2 text-slate-800 dark:text-slate-200">
                  <p>
                    According to the <strong>Admissions Brochure 2026</strong>:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li><strong>Eligibility:</strong> Minimum <strong>75% aggregate</strong> in 10+2 (PCM) or top 20 percentile in state board. Valid JEE Main or Institutional Entrance score required.</li>
                    <li><strong>Application Deadline:</strong> Phase 1 closes on <strong>June 15, 2026</strong> at 11:59 PM IST.</li>
                  </ul>
                </div>

                {/* Grounding Source Card Preview */}
                <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4 text-brand-500 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Admissions_Brochure_2026.txt</p>
                      <p className="text-[11px] text-slate-500">Cited at Page 1 • Admissions Cell • 96% Match</p>
                    </div>
                  </div>
                  <Link href="/chat" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline text-[11px]">
                    Try It Live →
                  </Link>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Core Institutional Knowledge Topics */}
      <section className="py-20 bg-slate-100/50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Institutional Knowledge Base
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Everything students need, indexed and ready
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              CampusMind synthesizes data across official registrar publications into instant, cited responses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all group space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${cat.color} border`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {cat.badge}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {cat.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>

                  <Link
                    href="/chat"
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform"
                  >
                    <span>Ask about this topic</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* RAG Architecture & Zero Hallucination Pillar */}
      <section className="py-20 border-b border-slate-200 dark:border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Strict Hallucination Resistance</span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Why standard AI fails for colleges — and why RAG wins
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Generic LLMs hallucinate fee numbers, make up fake deadlines, and guess hostel policies. CampusMind uses a strict 3-stage validation pipeline:
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">Semantic Dense Vector Search</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Qdrant vector engine identifies top-k relevant chunks filtered by institutional department.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">Similarity Threshold Gate</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      If document match confidence falls below threshold, the assistant explicitly states the data is missing rather than guessing.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">Full Citation Traceability</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Every claim links back to the original uploaded PDF snippet with instant document download access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/chat"
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold shadow-md shadow-brand-500/20 transition-all"
                >
                  <span>Experience Grounded Chat</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Architecture Card Grid */}
            <div className="bg-slate-100 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Enterprise RAG Stack
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <Cpu className="w-5 h-5 text-brand-500" />
                  <p className="font-bold text-sm text-slate-900 dark:text-white">FastAPI Async</p>
                  <p className="text-[11px] text-slate-500">High-throughput token streaming & JWT auth</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <Database className="w-5 h-5 text-indigo-500" />
                  <p className="font-bold text-sm text-slate-900 dark:text-white">Qdrant Vector DB</p>
                  <p className="text-[11px] text-slate-500">Cosine similarity indexing with metadata filters</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <Layers className="w-5 h-5 text-emerald-500" />
                  <p className="font-bold text-sm text-slate-900 dark:text-white">Smart Chunker</p>
                  <p className="text-[11px] text-slate-500">Sentence-aware recursive chunking with page bounds</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <Lock className="w-5 h-5 text-amber-500" />
                  <p className="font-bold text-sm text-slate-900 dark:text-white">Role Security</p>
                  <p className="text-[11px] text-slate-500">Strict server-side validation & audit logging</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-800 dark:text-brand-300 font-medium">
                ⚡ Real-time ingestion: Documents uploaded in Admin Dashboard become searchable in seconds.
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-b from-transparent to-brand-50/50 dark:to-brand-950/20">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-brand-500/30">
            <GraduationCap className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ready to find answers in seconds?
          </h2>

          <p className="text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Join students and faculty getting instant, verified answers across college admissions, fees, hostel rules, and placements.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/chat"
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 hover:scale-[1.02] transition-all"
            >
              Launch Chatbot
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Sign In to Save History
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-8 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
              C
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">CampusMind AI</span>
            <span>— College Information Assistant</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/chat" className="hover:text-brand-500 transition-colors">Chat</Link>
            <Link href="/admin/documents" className="hover:text-brand-500 transition-colors">Documents</Link>
            <Link href="/admin/dashboard" className="hover:text-brand-500 transition-colors">Analytics</Link>
            <Link href="/login" className="hover:text-brand-500 transition-colors">Login</Link>
          </div>

          <p>© 2026 CampusMind. Grounded College RAG Assistant.</p>
        </div>
      </footer>

    </div>
  );
}
