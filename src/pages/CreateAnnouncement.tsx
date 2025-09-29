import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileUploadService, UPLOAD_CONFIGS } from '@/services/fileUploadService';
import useAuth from '@/hooks/useAuth';
import {
  Megaphone,
  Paperclip,
  Users,
  ShieldCheck,
  Globe2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

type Audience = 'students' | 'committee' | 'all';

export default function CreateAnnouncement() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState<Audience | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user } = useAuth();

  const reset = () => {
    setTitle('');
    setDescription('');
    setAudience(null);
    setAttachments([]);
    setUploadErrors([]);
    setErrors({});
    setMessage(null);
  };

  const validate = () => {
    const e: Record<string,string> = {};
    if (!title.trim()) e.title = 'Title required';
    if (!description.trim()) e.description = 'Description required';
    if (!audience) e.audience = 'Select audience';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFiles = (filesList: FileList | null) => {
    if (!filesList) return;
    
    const newFiles = Array.from(filesList);
    const errors: string[] = [];
    
    // Validate each file
    newFiles.forEach((file) => {
      const validationError = FileUploadService.validateFile(file, UPLOAD_CONFIGS.ANNOUNCEMENTS);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      }
    });
    
    // Only add valid files
    const validFiles = newFiles.filter((file) => {
      const validationError = FileUploadService.validateFile(file, UPLOAD_CONFIGS.ANNOUNCEMENTS);
      return !validationError;
    });
    
    setUploadErrors(errors);
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeFile = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAnnounce = async () => {
    setMessage(null);
    setUploadErrors([]);
    if (!validate()) return;
    
    setLoading(true);
    try {
      // Debug: Check if user is authenticated
      console.log('User authentication status:', { 
        user: user ? 'authenticated' : 'not authenticated',
        userId: (user as any)?.id,
        email: (user as any)?.email 
      });
      
      // Upload attachments using our service
      const uploadResults = await FileUploadService.uploadFiles(attachments, UPLOAD_CONFIGS.ANNOUNCEMENTS);
      
      // Check for upload errors
      const failedUploads = uploadResults.filter(result => result.error);
      if (failedUploads.length > 0) {
        const errorMessages = failedUploads.map(result => result.error!);
        console.error('Upload failed:', errorMessages);
        setUploadErrors(errorMessages);
        setMessage('Some files failed to upload. Please check console for details and verify your Supabase storage policies.');
        return;
      }

      // Get successful upload URLs
      const urls = uploadResults.map(result => result.url);

      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        audience,
        attachments: urls,
        created_by: (user as any)?.id || null,
        created_by_email: (user as any)?.email || null,
      };

      const { error: insertErr } = await supabase.from('announcements').insert(payload);
      if (insertErr) throw insertErr;

      reset();
      setMessage('Announcement published successfully!');
    } catch (err: any) {
      console.error('Error publishing announcement:', err);
      setMessage(`Publish failed: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const audienceButtons: { key: Audience; label: string; icon: React.ReactNode }[] = [
    { key: 'students', label: 'Students', icon: <Users className="h-4 w-4" /> },
    { key: 'committee', label: 'Committee', icon: <ShieldCheck className="h-4 w-4" /> },
    { key: 'all', label: 'All', icon: <Globe2 className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-12">
      <div className="mx-auto max-w-6xl space-y-10 px-6">
        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 ring-1 ring-inset ring-blue-500/20">
                <Megaphone className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-500/70">Communication hub</p>
                <div>
                  <h1 className="text-3xl font-semibold text-slate-900">Create a new announcement</h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Publish updates across cohorts and committees with attachments, targeted audiences, and rich formatting support.
                  </p>
                </div>
              </div>
            </div>
           
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur">
            <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-blue-50 px-8 py-6">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-blue-500">
                  <UploadCloud className="h-3.5 w-3.5" />
                  Draft
                </span>
                <span>Compose</span>
                <span className="text-slate-300">Review</span>
                <span className="text-slate-300">Publish</span>
              </div>
            </div>

            <div className="space-y-10 px-8 py-10">
              {message && (
                <div
                  className={`flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm shadow-sm ${
                    message.includes('failed') || message.toLowerCase().includes('error')
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {message.includes('failed') || message.toLowerCase().includes('error') ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Title
                      <span className="text-rose-500">Required</span>
                    </label>
                    <div className={`rounded-2xl border bg-white/70 shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 ${errors.title ? 'border-rose-300' : 'border-slate-200'}`}>
                      <input
                        type="text"
                        className="h-12 w-full rounded-2xl border-none bg-transparent px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        value={title}
                        maxLength={140}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Concise headline for your announcement"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-rose-500">{errors.title}</span>
                      <span className="text-slate-400">{title.length}/140</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Description
                      <span className="text-rose-500">Required</span>
                    </label>
                    <div className={`rounded-2xl border bg-white/70 shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 ${errors.description ? 'border-rose-300' : 'border-slate-200'}`}>
                      <textarea
                        className="min-h-[160px] w-full rounded-2xl border-none bg-transparent px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Provide context, timelines, and any next steps your readers should know."
                      />
                    </div>
                    <span className="text-xs text-rose-500">{errors.description}</span>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Audience <span className="text-rose-500">Required</span>
                    </label>
                    <div
                      className="flex w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-sm"
                      role="radiogroup"
                      aria-label="Select announcement audience"
                    >
                      {audienceButtons.map(btn => {
                        const active = audience === btn.key;
                        return (
                          <button
                            key={btn.key}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setAudience(btn.key)}
                            className={`flex-1 px-4 py-3 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                              active ? 'bg-blue-600 text-white shadow-inner' : 'text-slate-600 hover:bg-white'
                            }`}
                          >
                            <span className="inline-flex items-center gap-2">
                              {btn.icon}
                              {btn.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs text-rose-500">{errors.audience}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <span>Attachments</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Info className="h-3.5 w-3.5" /> Optional
                      </span>
                    </div>
                    <div
                      className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-6 text-center transition hover:border-blue-300 hover:bg-blue-50/70"
                      onDragOver={e => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                      }}
                      onDrop={e => {
                        e.preventDefault();
                        handleFiles(e.dataTransfer.files);
                      }}
                      onClick={() => document.getElementById('announcement-files')?.click()}
                    >
                      <Paperclip className="mx-auto h-7 w-7 text-blue-500" />
                      <p className="mt-3 text-sm font-medium text-slate-700">Drag &amp; drop files or click to upload</p>
                      <p className="mt-1 text-xs text-slate-400">PDF, Word, Excel, images, text • up to 10MB each</p>
                      <input id="announcement-files" type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
                    </div>

                    {uploadErrors.length > 0 && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
                        <div className="mb-2 flex items-center gap-2 font-semibold">
                          <AlertCircle className="h-4 w-4" /> Upload issues
                        </div>
                        <ul className="space-y-1 text-xs">
                          {uploadErrors.map((error, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="mt-0.5 text-rose-500">•</span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {attachments.length > 0 && (
                      <ul className="space-y-2">
                        {attachments.map((file, idx) => (
                          <li
                            key={`${file.name}-${idx}`}
                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
                          >
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <div className="flex-1 overflow-hidden">
                              <p className="truncate font-medium text-slate-700">{file.name}</p>
                              <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="rounded-full p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-6 shadow-inner">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-600 tracking-wide">Live preview</h2>
                    <span className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Preview
                    </span>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">{title || 'Announcement title'}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                      {description || 'Announcement description will appear here. Provide details to inform your audience.'}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-700 ring-1 ring-inset ring-blue-100">
                        <Megaphone className="h-3.5 w-3.5" />
                        {audience ? (audience === 'students' ? 'Students' : audience === 'committee' ? 'Committee' : 'All audiences') : 'Audience not set'}
                      </span>
                      {attachments.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-indigo-700 ring-1 ring-inset ring-indigo-100">
                          <Paperclip className="h-3.5 w-3.5" /> {attachments.length} file(s)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4 text-xs text-slate-500">
                    High-contrast preview ensures readability across light and dark themes.
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Reset form
                </button>
                <button
                  type="button"
                  onClick={handleAnnounce}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Publishing…' : 'Publish announcement'}
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-5 self-start">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
                  <Info className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Announcement guidelines</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Lead with the outcome or action you want readers to take.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Keep attachments organized and labeled for quick scanning.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Audience selection controls visibility in the portal and email alerts.
                </li>
              </ul>
            </div>

          
          </aside>
        </div>
      </div>
    </div>
  );
}
