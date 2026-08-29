'use client';

import React, { useState } from 'react';
import {
  User,
  Sparkles,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Info,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { MessageItem, SourceReference, chatApi } from '@/lib/api';
import SourceCard from './SourceCard';
import { showToast } from '../shared/Toast';

interface MessageBubbleProps {
  message: MessageItem;
  onViewDocument?: (source: SourceReference) => void;
}

export default function MessageBubble({ message, onViewDocument }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<'up' | 'down' | null>(
    message.feedback?.rating || null
  );
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState(message.feedback?.comment || '');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const isAssistant = message.role === 'assistant';
  const isUnknown = message.is_unknown;

  const copyText = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    showToast('Message copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (rating: 'up' | 'down') => {
    setFeedbackRating(rating);
    try {
      await chatApi.submitFeedback(message.id, rating, feedbackComment);
      showToast(rating === 'up' ? 'Feedback recorded! 👍' : 'Feedback recorded. 👎', 'success');
      if (rating === 'down') {
        setShowFeedbackInput(true);
      }
    } catch {
      showToast('Failed to record feedback', 'error');
    }
  };

  const submitComment = async () => {
    if (!feedbackRating) return;
    setSubmittingFeedback(true);
    try {
      await chatApi.submitFeedback(message.id, feedbackRating, feedbackComment);
      showToast('Thank you for your detailed feedback!', 'success');
      setShowFeedbackInput(false);
    } catch {
      showToast('Failed to save comment', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Format message content with rich paragraphs, bullet points, and citations
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1.5" />;

          // Heading
          if (trimmed.startsWith('### ')) {
            return <h4 key={idx} className="font-bold text-base mt-2 text-slate-900 dark:text-white">{trimmed.replace('### ', '')}</h4>;
          }
          if (trimmed.startsWith('## ')) {
            return <h3 key={idx} className="font-bold text-lg mt-3 text-slate-900 dark:text-white">{trimmed.replace('## ', '')}</h3>;
          }

          // Bullet points
          if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const cleanText = trimmed.replace(/^[•\-\*]\s*/, '');
            return (
              <div key={idx} className="flex items-start space-x-2 pl-2">
                <span className="text-brand-500 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cleanText) }} />
              </div>
            );
          }

          // Numbered list items
          if (/^\d+\.\s/.test(trimmed)) {
            return (
              <div key={idx} className="flex items-start space-x-2 pl-2">
                <span className="font-bold text-brand-600 dark:text-brand-400">{trimmed.split(' ')[0]}</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed.replace(/^\d+\.\s*/, '')) }} />
              </div>
            );
          }

          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text: string): string => {
    // Bold **text**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-950 dark:text-slate-100">$1</strong>');
    // Italic *text*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic text-slate-600 dark:text-slate-300">$1</em>');
    // Highlight [Doc, Page X]
    formatted = formatted.replace(/\[(.*?, Page \d+)\]/g, '<span class="inline-block px-1.5 py-0.5 my-0.5 rounded text-[11px] font-semibold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-800">$1</span>');
    return formatted;
  };

  return (
    <div className={`flex w-full py-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex items-start space-x-3 max-w-3xl w-full ${isAssistant ? '' : 'flex-row-reverse space-x-reverse'}`}>
        
        {/* Avatar */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            isAssistant
              ? 'bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-brand-500/20'
              : 'bg-slate-800 dark:bg-slate-700 text-slate-100'
          }`}
        >
          {isAssistant ? <Sparkles className="w-5 h-5" /> : <User className="w-5 h-5" />}
        </div>

        {/* Message Container */}
        <div className="flex-1 space-y-2.5 min-w-0">
          
          {/* Header Info */}
          <div className={`flex items-center space-x-2 text-xs ${isAssistant ? 'justify-start' : 'justify-end'}`}>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {isAssistant ? 'CampusMind AI' : 'You'}
            </span>

            {isAssistant && message.confidence_score !== undefined && !isUnknown && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-300 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Grounded Citations ({(message.confidence_score * 100).toFixed(0)}%)</span>
              </span>
            )}

            <span className="text-[11px] text-slate-400">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Bubble Box */}
          <div
            className={`p-4 rounded-2xl shadow-sm transition-all ${
              isAssistant
                ? isUnknown
                  ? 'bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-slate-800 dark:text-slate-100'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                : 'bg-brand-600 text-white rounded-tr-sm ml-auto'
            }`}
          >
            {isAssistant && isUnknown && (
              <div className="flex items-center space-x-2 mb-2.5 pb-2 border-b border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Information Not In Official College Records</span>
              </div>
            )}

            {isAssistant ? renderFormattedContent(message.content) : <p className="text-sm whitespace-pre-wrap">{message.content}</p>}
          </div>

          {/* Cited Sources Section */}
          {isAssistant && message.sources && message.sources.length > 0 && !isUnknown && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
                <span>Cited Verification Sources ({message.sources.length}):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.sources.map((src, i) => (
                  <SourceCard key={i} source={src} onViewDocument={onViewDocument} />
                ))}
              </div>
            </div>
          )}

          {/* Action Bar (Copy & Feedback) */}
          {isAssistant && (
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={copyText}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center space-x-1 transition-colors"
                title="Copy message"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800" />

              <button
                onClick={() => handleFeedback('up')}
                className={`p-1.5 rounded-lg text-xs flex items-center space-x-1 transition-colors ${
                  feedbackRating === 'up'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Helpful"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleFeedback('down')}
                className={`p-1.5 rounded-lg text-xs flex items-center space-x-1 transition-colors ${
                  feedbackRating === 'down'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Not helpful"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Feedback comment drawer */}
          {showFeedbackInput && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 animate-fade-in text-xs">
              <p className="font-semibold text-slate-700 dark:text-slate-200">How can we improve this answer?</p>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Let us know what was inaccurate or missing..."
                rows={2}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowFeedbackInput(false)}
                  className="px-2.5 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={submitComment}
                  disabled={submittingFeedback}
                  className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-md shadow-sm"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
