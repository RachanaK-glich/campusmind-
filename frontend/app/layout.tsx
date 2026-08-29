import type { Metadata } from 'next';
import './globals.css';
import React from 'react';

export const metadata: Metadata = {
  title: 'CampusMind — AI College Information Assistant',
  description: 'Retrieval-Augmented Generation AI Assistant for College Admissions, Fees, Exams, Hostel, and Placement Queries with Grounded Citations.',
  keywords: ['CampusMind', 'College AI', 'RAG Chatbot', 'Admissions Assistant', 'Student Queries', 'College FAQ'],
};

import ToastContainer from '@/components/shared/Toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-brand-500 selection:text-white transition-colors duration-200">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
