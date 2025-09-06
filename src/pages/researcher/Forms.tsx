import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formsCatalog, incrementFormSubmissionCount, getFormSubmissionCounts } from '@/constants/forms';
import type { FormDefinition, FormField } from '@/constants/forms';
import { Download, RefreshCcw } from 'lucide-react';


const FieldRenderer: React.FC<{
  field: FormField;
  value: any;
  onChange: (name: string, value: any) => void;
}> = ({ field, value, onChange }) => {
  const base = 'w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition';
  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          className={base}
          rows={field.rows || 3}
          placeholder={field.placeholder}
          required={field.required}
          value={value || ''}
          onChange={e => onChange(field.name, e.target.value)}
        />
      );
    case 'select':
      return (
        <select
          className={base}
          required={field.required}
          value={value || ''}
          onChange={e => onChange(field.name, e.target.value)}
        >
          <option value="">-- Select --</option>
          {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    case 'date':
      return (
        <input
          type="date"
          className={base}
          required={field.required}
          value={value || ''}
          onChange={e => onChange(field.name, e.target.value)}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          className={base}
          required={field.required}
          value={value ?? ''}
          onChange={e => onChange(field.name, e.target.value === '' ? '' : Number(e.target.value))}
        />
      );
    case 'file':
      return (
        <input
          type="file"
          className={base}
          required={field.required}
          onChange={e => onChange(field.name, e.target.files?.[0] || null)}
        />
      );
    default:
      return (
        <input
          type="text"
          className={base}
          placeholder={field.placeholder}
          required={field.required}
          value={value || ''}
          onChange={e => onChange(field.name, e.target.value)}
        />
      );
  }
};

const RForms: React.FC = () => {
  const location = useLocation();
  useNavigate(); 
 
  const [activeForm, setActiveForm] = useState<FormDefinition | null>(null);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any | null>(null);
  const [, setCounts] = useState<Record<string, number>>(() => getFormSubmissionCounts());



  const updateField = (name: string, value: any) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeForm) return;
    setSubmitting(true);
    try {
    
      setSubmittedData({ formId: activeForm.id, ...formState, submittedAt: new Date().toISOString() });
  const newVal = incrementFormSubmissionCount(activeForm.id);
  setCounts(prev => ({ ...prev, [activeForm.id]: newVal }));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const search = new URLSearchParams(location.search);
    const formId = search.get('form');
    if (formId) {
      const found = formsCatalog.find(f => f.id === formId);
      if (found && (!activeForm || activeForm.id !== found.id)) {
        setActiveForm(found);
 
      }
    }
  }, [location.search, activeForm]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-2 md:px-6">
      <h1 className="text-3xl font-semibold px-4 mb-2 tracking-tight text-gray-800">Forms</h1>
      <div>
        {/* Active form area */}
        <div>
          {!activeForm && (
            <div className="p-8 border-2 border-dashed rounded-xl text-center text-gray-500 bg-white">
              <p className="font-medium mb-2">Select a form.</p>
              <p className="text-sm">Forms are grouped by category.</p>
            </div>
          )}
          {activeForm && (
            (() => {
              const requiredTotal = activeForm.fields.filter(f => f.required).length;
              const requiredCompleted = activeForm.fields.filter(f => f.required && formState[f.name] !== undefined && formState[f.name] !== '' && formState[f.name] !== null).length;
              const percent = requiredTotal ? Math.round((requiredCompleted / requiredTotal) * 100) : 0;
              return (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-gray-200 overflow-hidden ring-1 ring-gray-100">
                  <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-600/5 via-blue-500/5 to-indigo-500/5 relative">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm text-base font-medium">
                        {activeForm.icon ? <activeForm.icon className="size-5" /> : <Download className="size-5" />}
                      </span>
                      <span className="flex-1 leading-tight pt-1">
                        {activeForm.title}
                        {activeForm.description && <span className="block text-xs font-normal text-gray-500 mt-1">{activeForm.description}</span>}
                      </span>
                    </h2>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] uppercase tracking-wide font-semibold text-gray-500">Completion</span>
                        <span className="text-[11px] font-medium text-gray-600">{requiredCompleted}/{requiredTotal} Required ({percent}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button type="button" className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                        <Download className="size-3" /> Template
                      </button>
                      <button type="button" onClick={() => { setFormState({}); setSubmittedData(null); }} className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm">
                        <RefreshCcw className="size-3" /> Reset
                      </button>
                    </div>
                  </div>
                  <form onSubmit={handleSubmit} className="relative p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {activeForm.fields
                        .filter(field => {
                          if (field.dependsOn) {
                            const val = formState[field.dependsOn];
                            if (field.showIfEquals !== undefined && val !== field.showIfEquals) return false;
                            if (field.showIfIn && !field.showIfIn.includes(val)) return false;
                          }
                          return true;
                        })
                        .map(field => {
                          const fullWidth = field.type === 'textarea' || field.type === 'file' || (field.rows && field.rows > 3);
                          const filled = formState[field.name] !== undefined && formState[field.name] !== '' && formState[field.name] !== null;
                          return (
                            <div key={field.name} className={`group flex flex-col gap-1 rounded-lg border bg-white/70 backdrop-blur-sm px-4 py-3 shadow-sm hover:shadow-md transition border-gray-200 focus-within:border-blue-400 focus-within:shadow ${fullWidth ? 'md:col-span-2' : ''}`}>
                              <label className="text-xs font-semibold tracking-wide text-gray-600 group-focus-within:text-blue-600 flex items-center gap-2">
                                <span>{field.label}</span>
                                {field.required && <span className="text-red-500">*</span>}
                                {filled && <span className="ml-auto inline-flex items-center rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">OK</span>}
                              </label>
                              <FieldRenderer field={field} value={formState[field.name]} onChange={updateField} />
                              {field.help && <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{field.help}</p>}
                            </div>
                          );
                        })}
                    </div>
                    <div className="mt-8 pt-5 border-t border-gray-200 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-md bg-blue-600 text-white font-medium text-sm shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {submitting ? 'Submitting…' : (activeForm.submitLabel || 'Submit')}
                      </button>
                      <span className="text-[11px] text-gray-500">Review before submitting. Fields marked * are required.</span>
                    </div>
                  </form>
                  {submittedData && (
                    <div className="border-t bg-green-50/80 backdrop-blur px-6 py-4 text-sm text-green-700">
                      <div className="font-semibold mb-1">Form data captured (demo only)</div>
                      <pre className="whitespace-pre-wrap text-xs max-h-60 overflow-y-auto bg-white/70 p-3 rounded border border-green-200">{JSON.stringify(submittedData, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })()
          )}
  </div>
      </div>
      
    </div>
  );
};

export default RForms;
