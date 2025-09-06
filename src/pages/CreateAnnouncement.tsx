import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileUploadService, UPLOAD_CONFIGS } from '@/services/fileUploadService';
import useAuth from '@/hooks/useAuth';
import { Megaphone, Paperclip, Users, ShieldCheck, Globe2, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 flex items-center gap-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-white to-blue-50">
          <div className="h-12 w-12 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center">
            <Megaphone className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Create Announcement</h1>
            <p className="text-sm text-gray-500 mt-1">Share important updates with the selected audience.</p>
          </div>
        </div>

        <div className="px-8 py-8 space-y-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className={`w-full rounded-lg border ${errors.title ? 'border-red-400' : 'border-gray-300'} bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100`}
                  value={title}
                  maxLength={140}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Concise headline"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span className="text-red-500">{errors.title}</span>
                  <span>{title.length}/140</span>
                </div>
              </div>
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                <textarea
                  className={`w-full rounded-lg border ${errors.description ? 'border-red-400' : 'border-gray-300'} bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-h-[140px] resize-y`}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide the full announcement details."
                />
                <span className="mt-1 text-xs text-red-500 inline-block">{errors.description}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Audience <span className="text-red-500">*</span></label>
                <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50 overflow-hidden divide-x divide-gray-300" role="radiogroup" aria-label="Audience selector">
                  {audienceButtons.map(btn => {
                    const active = audience === btn.key;
                    return (
                      <button
                        key={btn.key}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setAudience(btn.key)}
                        className={`px-4 py-2 flex items-center gap-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-white'}`}
                      >
                        {btn.icon}
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
                <span className="mt-1 text-xs text-red-500 block">{errors.audience}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                <div
                  className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer"
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                  onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                  onClick={() => document.getElementById('announcement-files')?.click()}
                >
                  <Paperclip className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                  <p className="text-xs text-gray-600">Drag & drop or click to browse</p>
                  <p className="text-xs text-gray-500 mt-1">Max 10MB per file • PDF, Word, Excel, Images, Text</p>
                  <input id="announcement-files" type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
                </div>
                
                {/* Upload Errors */}
                {uploadErrors.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 text-sm font-medium mb-2">
                      <AlertCircle className="h-4 w-4" />
                      Upload Errors
                    </div>
                    <ul className="text-sm text-red-600 space-y-1">
                      {uploadErrors.map((error, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {attachments.length > 0 && (
                  <ul className="mt-3 bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-auto text-sm">
                    {attachments.map((f,i) => (
                      <li key={i} className="flex items-center gap-3 px-3 py-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="flex-1 truncate">{f.name}</span>
                        <span className="text-xs text-gray-400">{(f.size/1024).toFixed(1)} KB</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 p-1"><X className="h-4 w-4" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-6 flex flex-col">
              <h2 className="text-sm font-semibold text-slate-600 mb-3 tracking-wide">Live Preview</h2>
              <div className="flex-1 rounded-lg border border-slate-200 bg-white p-5 shadow-sm relative">
                <div className="absolute right-3 top-3 text-[10px] uppercase tracking-wider font-medium text-slate-400">Preview</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2 break-words">{title || 'Announcement Title'}</h3>
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed min-h-[80px]">{description || 'Announcement description will appear here. Provide details to inform your audience.'}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                    <Megaphone className="h-3.5 w-3.5" />
                    {audience ? (audience === 'students' ? 'Students' : audience === 'committee' ? 'Committee' : 'All Users') : 'Audience not set'}
                  </span>
                  {attachments.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Paperclip className="h-3.5 w-3.5" /> {attachments.length} file(s)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className={`text-sm px-4 py-3 rounded-lg border flex items-center gap-2 ${message.includes('failed') || message.toLowerCase().includes('error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
              {message.includes('failed') || message.toLowerCase().includes('error') ? (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              )}
              {message}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={reset}
              className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleAnnounce}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Publishing…' : 'Publish Announcement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
