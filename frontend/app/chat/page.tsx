'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  Loader2,
  RefreshCw,
  Info,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import SuggestedQuestions from '@/components/chat/SuggestedQuestions';
import DocumentViewerModal from '@/components/chat/DocumentViewerModal';
import {
  chatApi,
  ConversationSummary,
  MessageItem,
  SourceReference,
  ChatResponse
} from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { showToast } from '@/components/shared/Toast';

export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewingSource, setViewingSource] = useState<SourceReference | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const convs = await chatApi.getConversations();
      setConversations(convs);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  // Load active conversation details
  const loadConversation = async (id: string) => {
    setActiveConversationId(id);
    try {
      const detail = await chatApi.getConversation(id);
      setMessages(detail.messages || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load conversation messages', 'error');
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await chatApi.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewChat();
      }
      showToast('Conversation deleted', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete conversation', 'error');
    }
  };

  // Send query via SSE Streaming
  const handleSendMessage = async (queryText: string, categoryOverride?: string) => {
    if (!queryText.trim() || isLoading) return;

    const userTempId = 'user-' + Date.now();
    const botTempId = 'bot-' + Date.now();

    const userMsg: MessageItem = {
      id: userTempId,
      conversation_id: activeConversationId || '',
      role: 'user',
      content: queryText,
      sources: [],
      is_unknown: false,
      created_at: new Date().toISOString(),
    };

    const initialBotMsg: MessageItem = {
      id: botTempId,
      conversation_id: activeConversationId || '',
      role: 'assistant',
      content: '',
      sources: [],
      confidence_score: 1.0,
      is_unknown: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, initialBotMsg]);
    setIsLoading(true);

    let accumulatedContent = '';

    await chatApi.streamQuery({
      query: queryText,
      conversation_id: activeConversationId,
      category: categoryOverride || (selectedCategory !== 'all' ? selectedCategory : undefined),
      onStart: (data) => {
        if (!activeConversationId && data.conversation_id) {
          setActiveConversationId(data.conversation_id);
          fetchConversations();
        }

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === botTempId) {
              return {
                ...msg,
                id: data.message_id || botTempId,
                conversation_id: data.conversation_id,
                sources: data.sources || [],
                confidence_score: data.confidence_score,
                is_unknown: data.is_unknown || false,
              };
            }
            return msg;
          })
        );
      },
      onToken: (token) => {
        accumulatedContent += token;
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === botTempId || msg.role === 'assistant' && msg === prev[prev.length - 1]) {
              return {
                ...msg,
                content: accumulatedContent,
              };
            }
            return msg;
          })
        );
      },
      onDone: (message_id) => {
        setIsLoading(false);
        fetchConversations();
      },
      onError: (err) => {
        setIsLoading(false);
        showToast(err.message || 'Error communicating with AI knowledge base', 'error');
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === botTempId) {
              return {
                ...msg,
                content: '⚠️ An error occurred while retrieving official records. Please try again.',
                is_unknown: true,
              };
            }
            return msg;
          })
        );
      },
    });
  };

  const handleOpenDocumentModal = (source: SourceReference) => {
    setViewingSource(source);
    setIsModalOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      <Navbar />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelectConversation={loadConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/60 relative">
          
          {/* Chat Top Subheader */}
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
              >
                {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
              </button>

              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  CampusMind Live RAG Pipeline
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 font-semibold">
                Grounded Citations Active
              </span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <SuggestedQuestions
                onSelectQuestion={(q, cat) => {
                  if (cat) setSelectedCategory(cat);
                  handleSendMessage(q, cat);
                }}
              />
            ) : (
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((msg, index) => (
                  <MessageBubble
                    key={msg.id || index}
                    message={msg}
                    onViewDocument={handleOpenDocumentModal}
                  />
                ))}

                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex items-center space-x-3 py-3 animate-fade-in">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 animate-spin" />
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2 shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                      <span>Retrieving official documents and assembling grounded context...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Sticky Input Footer */}
          <div className="shrink-0 bg-gradient-to-t from-slate-50 via-slate-50 dark:from-slate-950 dark:via-slate-950 to-transparent pt-2">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

        </main>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        source={viewingSource}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setViewingSource(null);
        }}
      />
    </div>
  );
}
