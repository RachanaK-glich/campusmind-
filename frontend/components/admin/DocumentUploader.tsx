'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, Building, Tag } from 'lucide-react';
import { documentsApi, DocumentItem } from '@/lib/api';
import { showToast } from '../shared/Toast';

interface DocumentUploaderProps {
  onUploadSuccess: (doc: DocumentItem) => void;
}

const CATEGORIES = [
  { id: 'admissions', label: 'Admissions' },
  { id: 'fees', label: 'Fees & Scholarships' },
  { id: 'hostel', label: 'Hostel & Mess' },
  { id: 'exams', label: 'Exams & Academic Calendar' },
  { id: 'placements', label: 'Placements & Career' },
  { id: 'library', label: 'Library & Resources' },
  { id: 'policies', label: 'Policies & Discipline' },
  { id: 'events', label: 'Events & Fests' },
  { id: 'other', label: 'Other / General' },
];

export default function DocumentUploader({ onUploadSuccess }: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('admissions');
  const [department, setDepartment] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    const validExts = ['.pdf', '.docx', '.doc', '.txt', '.md'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

    if (!validExts.includes(ext)) {
      showToast(`Invalid file type. Please upload PDF, DOCX, or TXT`, 'error');
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      showToast(`File exceeds 25MB maximum limit`, 'error');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      // Auto populate title from filename
      const baseName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.'));
      setTitle(baseName.replace(/[_\-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast('Please select a document file to upload', 'error');
      return;
    }

    setIsUploading(true);
    setUploadStep('Extracting text and pages...');

    try {
      setTimeout(() => setUploadStep('Chunking document & sentence splitting...'), 600);
      setTimeout(() => setUploadStep('Generating dense vector embeddings...'), 1200);
      setTimeout(() => setUploadStep('Upserting to Qdrant vector index...'), 1800);

      const uploadedDoc = await documentsApi.uploadDocument(
        file,
        title.trim() || undefined,
        category,
        department.trim() || undefined
      );

      showToast(`Document "${uploadedDoc.title}" successfully ingested and indexed!`, 'success');
      onUploadSuccess(uploadedDoc);

      // Reset form
      setFile(null);
      setTitle('');
      setDepartment('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      showToast(err.message || 'Failed to upload and ingest document', 'error');
    } finally {
      setIsUploading(false);
      setUploadStep('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Upload College Document</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ingest official brochures, fee structures, notices, or guidelines into the vector knowledge base
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30'
              : file
              ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 bg-slate-50/50 dark:bg-slate-950/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md"
            onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
            className="hidden"
          />

          {file ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Click or drag another file to replace
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 text-slate-500 dark:text-slate-400">
              <UploadCloud className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="text-brand-600 dark:text-brand-400 font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-400">PDF, DOCX, TXT, or MD (Max 25MB)</p>
            </div>
          )}
        </div>

        {/* Metadata Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Admission Guidelines 2026"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 capitalize"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department / Office (Optional)
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Admissions Cell"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-brand-700 dark:text-brand-300 flex items-center space-x-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{uploadStep}</span>
              </span>
              <span className="text-brand-500 font-mono text-[11px]">Processing RAG Pipeline</span>
            </div>
            <div className="w-full h-2 rounded-full bg-brand-200 dark:bg-brand-900 overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full animate-pulse-subtle w-full" />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!file || isUploading}
          className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all ${
            file && !isUploading
              ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 hover:scale-[1.01]'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Ingesting & Embedding Document...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Ingest Document to Knowledge Base</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
