import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { researcherHistoryService } from '../../services/researcherHistoryService';
import type { ComprehensiveResearcherHistory } from '../../types/researcherHistory';
import { supabase } from '../../DB';
import { createRoot } from 'react-dom/client';
import { DOC_COMPONENT_MAP } from '@/components/forms/FormViewer';
import FinalReportForm from '@/components/forms/FinalReportForm';
import { 
  ArrowLeft, 
  FileText, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Download,
  Calendar,
  User,
  Folder,
  History,
  TrendingUp,
  Shield,
  ClipboardList,
  Rocket,
  Users,
  Flag,
  Archive,
  Eye,
  FileCheck
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const waitForRender = async (ms = 180) => {
  await new Promise(resolve => setTimeout(resolve, ms));
};

const waitForAssets = async (container: HTMLElement) => {
  try {
    if ('fonts' in document) {
      await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
    }
  } catch {
    // Ignore font readiness failures and continue rendering.
  }

  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );

  await waitForRender(120);
};

const copyDocumentStyles = (targetDoc: Document) => {
  const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
  styleNodes.forEach((node) => {
    targetDoc.head.appendChild(node.cloneNode(true));
  });
};

export default function ResearcherHistoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [history, setHistory] = useState<ComprehensiveResearcherHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await researcherHistoryService.getComprehensiveHistory(parseInt(id));
        setHistory(data);
        
        // Debug: Log file data to check file_url values
        if (data) {
          console.log('Sample files:', data.all_files.slice(0, 3).map(f => ({
            name: f.file_name,
            url: f.file_url,
            uploaded: f.uploaded_at,
            type: f.file_type
          })));
        }
      } catch (error) {
        console.error('Error fetching researcher history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [id]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPhaseIcon = (phaseNumber: number) => {
    const icons = [
      FileText, Shield, ClipboardList, Rocket, Users, Flag, Archive
    ];
    const Icon = icons[phaseNumber - 1] || FileText;
    return <Icon className="w-5 h-5" />;
  };

  const getPhaseColor = (status: string) => {
    if (status === 'Completed') return 'bg-green-500';
    if (status === 'In Progress') return 'bg-blue-500';
    return 'bg-gray-300';
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'file_upload': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'comment': return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'status_change': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'review': return <FileCheck className="w-5 h-5 text-orange-600" />;
      case 'deviation': return <Flag className="w-5 h-5 text-red-600" />;
      case 'final_report': return <Archive className="w-5 h-5 text-gray-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const resolveStoragePath = (rawPath: string): { bucket: string; path: string } | null => {
    if (!rawPath) return null;

    let path = rawPath.trim();
    if (!path) return null;

    // If this is already a URL, open directly.
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return null;
    }

    if (path.startsWith('/')) {
      path = path.slice(1);
    }

    const lowered = path.toLowerCase();
    if (lowered.startsWith('documents/')) {
      return { bucket: 'documents', path: path.substring('documents/'.length) };
    }
    if (lowered.startsWith('storage/')) {
      return { bucket: 'storage', path: path.substring('storage/'.length) };
    }

    if (lowered.includes('final-reports') || lowered.includes('final_reports')) {
      return { bucket: 'storage', path };
    }

    return { bucket: 'documents', path };
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      console.log('Attempting to download file:', { fileUrl, fileName });

      if (fileUrl.startsWith('form-data://')) {
        const virtualPath = fileUrl.replace('form-data://', '');
        const slashIndex = virtualPath.indexOf('/');
        if (slashIndex <= 0) {
          alert('Invalid form data path.');
          return;
        }

        const proposalId = Number(virtualPath.slice(0, slashIndex));
        const encodedFormName = virtualPath.slice(slashIndex + 1);
        const formName = decodeURIComponent(encodedFormName);

        const { data, error } = await supabase
          .from('form_data')
          .select('data, updated_at, form_name')
          .eq('proposal_id', proposalId)
          .eq('form_name', formName)
          .single();

        if (error || !data) {
          alert(`Could not fetch saved data for ${formName}.`);
          return;
        }

        const FormComponent = DOC_COMPONENT_MAP[formName];
        if (!FormComponent) {
          alert(`No form renderer found for ${formName}.`);
          return;
        }

        const { data: proposalData } = await supabase
          .from('proposals')
          .select('protocol_id, proposal_title, review_type, researcher, advisor')
          .eq('proposal_id', proposalId)
          .single();

        let researcherName = '';
        if (proposalData?.researcher) {
          const { data: researcherProfile } = await supabase
            .from('profiles')
            .select('fname, lname')
            .eq('id', proposalData.researcher)
            .single();

          researcherName = researcherProfile
            ? `${researcherProfile.fname || ''} ${researcherProfile.lname || ''}`.trim()
            : '';
        }

        let advisorName = '';
        if (proposalData?.advisor) {
          const { data: advisorProfile } = await supabase
            .from('profiles')
            .select('fname, lname')
            .eq('id', proposalData.advisor)
            .single();

          advisorName = advisorProfile
            ? `${advisorProfile.fname || ''} ${advisorProfile.lname || ''}`.trim()
            : '';
        }

        const printWindow = window.open('', '_blank', 'width=1200,height=900');
        if (!printWindow) {
          alert('Popup was blocked. Please allow popups and try again.');
          return;
        }

        printWindow.document.open();
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>${(fileName || formName).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
              <style>
                html, body {
                  margin: 0;
                  padding: 0;
                  background: white;
                }
                @page {
                  size: A4;
                  margin: 10mm;
                }
                @media print {
                  html, body {
                    background: white;
                  }
                }
                #print-root {
                  width: 100%;
                  display: block;
                  box-sizing: border-box;
                }
              </style>
            </head>
            <body>
              <div id="print-root"></div>
            </body>
          </html>
        `);
        printWindow.document.close();

        copyDocumentStyles(printWindow.document);

        const printRootEl = printWindow.document.getElementById('print-root');
        if (!printRootEl) {
          alert('Failed to prepare print view.');
          return;
        }

        const root = createRoot(printRootEl);
        root.render(
          <FormComponent
            proposalId={proposalId}
            protocolCode={proposalData?.protocol_id || ''}
            proposalTitle={proposalData?.proposal_title || ''}
            reviewType={proposalData?.review_type || ''}
            researcherName={researcherName}
            advisorName={advisorName}
            formName={formName}
            savedData={data.data || {}}
            readOnlyAdvisor={true}
          />
        );

        await waitForRender(260);
        await waitForAssets(printRootEl);

        printWindow.focus();
        printWindow.print();

        setTimeout(() => {
          root.unmount();
          printWindow.close();
        }, 800);
        return;
      }
      // If this is a stored JSON (fillable form saved as JSON), fetch it, parse and render
      if (fileUrl.toLowerCase().endsWith('.json')) {
        try {
          // Acquire a URL we can fetch (signed URL if stored in bucket)
          let jsonFetchUrl = fileUrl;
          if (!(jsonFetchUrl.startsWith('http://') || jsonFetchUrl.startsWith('https://'))) {
            const resolvedForJson = resolveStoragePath(fileUrl);
            if (resolvedForJson) {
              const { data: signed, error: signErr } = await supabase.storage
                .from(resolvedForJson.bucket)
                .createSignedUrl(resolvedForJson.path, 60);
              if (signErr) throw signErr;
              if (signed && signed.signedUrl) jsonFetchUrl = signed.signedUrl;
            }
          }

          const resp = await fetch(jsonFetchUrl);
          if (!resp.ok) throw new Error('Failed to fetch JSON file');
          const parsed = await resp.json();

          // Prefer saved data under `data` or `form` keys, fallback to whole payload
          const savedData = parsed.data || parsed.form || parsed;

          // Determine the form name to pick a renderer
          let formName = parsed.form_name || parsed.formName || parsed.form?.form_name || parsed.form?.formName;
          
          // Check if this is a final report JSON (by filename or content)
          const isFinalReport = fileName.toLowerCase().includes('final-report') || 
                                fileName.toLowerCase().includes('final_report') ||
                                (parsed.protocolCode && parsed.titleOfStudy); // Common final report fields

          if (!formName && isFinalReport) {
            formName = 'FinalReport'; // Use this to trigger FinalReportForm
          } else if (!formName) {
            // Try to infer from fileName or path
            const inferred = fileName || (fileUrl.split('/').pop() || '');
            formName = inferred.replace(/-final-report-filled\.json$/i, '').replace(/\.json$/i, '');
          }

          // Use FinalReportForm for final report JSONs, or lookup in map for other forms
          let FormComponent: any;
          if (formName === 'FinalReport' || isFinalReport) {
            FormComponent = FinalReportForm;
          } else {
            FormComponent = DOC_COMPONENT_MAP[formName];
          }

          if (!FormComponent) {
            // Last resort: use FinalReportForm if nothing else matches and it looks like a final report
            if (isFinalReport) {
              FormComponent = FinalReportForm;
            } else {
              // Open raw JSON as fallback only for non-final-report JSONs
              const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
              const blobUrl = URL.createObjectURL(blob);
              window.open(blobUrl, '_blank');
              return;
            }
          }

          // Fetch proposal metadata (researcher/advisor names) similar to form-data path
          const proposalId = Number(id);
          const { data: proposalData } = await supabase
            .from('proposals')
            .select('protocol_id, proposal_title, review_type, researcher, advisor')
            .eq('proposal_id', proposalId)
            .single();

          let researcherName = '';
          if (proposalData?.researcher) {
            const { data: researcherProfile } = await supabase
              .from('profiles')
              .select('fname, lname')
              .eq('id', proposalData.researcher)
              .single();
            researcherName = researcherProfile ? `${researcherProfile.fname || ''} ${researcherProfile.lname || ''}`.trim() : '';
          }

          let advisorName = '';
          if (proposalData?.advisor) {
            const { data: advisorProfile } = await supabase
              .from('profiles')
              .select('fname, lname')
              .eq('id', proposalData.advisor)
              .single();
            advisorName = advisorProfile ? `${advisorProfile.fname || ''} ${advisorProfile.lname || ''}`.trim() : '';
          }

          const printWindow = window.open('', '_blank', 'width=1200,height=900');
          if (!printWindow) {
            alert('Popup was blocked. Please allow popups and try again.');
            return;
          }

          printWindow.document.open();
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8" />
                <title>${(fileName || formName).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
                <style>
                  html, body { margin:0; padding:0; background: white; }
                  @page { size: A4; margin: 10mm; }
                  @media print { html, body { background: white; } }
                  #print-root { width:100%; display:block; box-sizing:border-box; }
                </style>
              </head>
              <body>
                <div id="print-root"></div>
              </body>
            </html>
          `);
          printWindow.document.close();

          copyDocumentStyles(printWindow.document);

          const printRootEl = printWindow.document.getElementById('print-root');
          if (!printRootEl) {
            alert('Failed to prepare print view.');
            return;
          }

          const root = createRoot(printRootEl);
          
          // FinalReportForm takes different props than other forms
          if (FormComponent === FinalReportForm) {
            root.render(
              <FinalReportForm
                savedData={savedData || {}}
              />
            );
          } else {
            root.render(
              <FormComponent
                proposalId={proposalId}
                protocolCode={proposalData?.protocol_id || ''}
                proposalTitle={proposalData?.proposal_title || ''}
                reviewType={proposalData?.review_type || ''}
                researcherName={researcherName}
                advisorName={advisorName}
                formName={formName}
                savedData={savedData || {}}
                readOnlyAdvisor={true}
              />
            );
          }

          await waitForRender(260);
          await waitForAssets(printRootEl);

          printWindow.focus();
          printWindow.print();

          setTimeout(() => {
            root.unmount();
            printWindow.close();
          }, 800);
          return;
        } catch (err) {
          console.error('Error rendering JSON form:', err);
          alert(`Could not render JSON form: ${err instanceof Error ? err.message : String(err)}`);
          return;
        }
      }
      
      // Validate file URL
      if (!fileUrl || fileUrl.trim() === '') {
        alert('File path is missing. This file may not have been uploaded correctly.');
        return;
      }

      // Some rows may already provide a fully accessible URL.
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        window.open(fileUrl, '_blank');
        return;
      }
      
      const resolved = resolveStoragePath(fileUrl);
      if (!resolved) {
        alert('Could not determine file location for this attachment.');
        return;
      }

      const cleanPath = resolved.path;
      
      console.log('Cleaned path:', cleanPath);
      
      // Determine which bucket to use based on path and fallback if needed.
      let bucketName = resolved.bucket;
      
      console.log('Using bucket:', bucketName);
      
      // Create a signed URL (valid for 60 seconds) for downloading
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(cleanPath, 60);
      
      if (error) {
        console.error('Supabase storage error:', error);
        // If it failed with one bucket, try the other
        const alternateBucket = bucketName === 'documents' ? 'storage' : 'documents';
        console.log(`Retrying with ${alternateBucket} bucket...`);
        
        const retry = await supabase.storage.from(alternateBucket).createSignedUrl(cleanPath, 60);
        if (retry.error) {
          console.error('Retry also failed:', retry.error);
          alert(`Failed to download file. The file may have been moved or deleted.\n\nPath: ${cleanPath}\nFile: ${fileName}\nError: ${error.message}`);
          return;
        }
        if (!retry.data || !retry.data.signedUrl) {
          throw new Error('No signed URL received');
        }
        
        // Success with alternate bucket - download the file
        window.open(retry.data.signedUrl, '_blank');
        return;
      }
      
      if (!data || !data.signedUrl) {
        throw new Error('No signed URL received');
      }
      
      console.log('Signed URL created successfully');
      
      // Open the signed URL in a new tab to download the file
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Determine the actual current status based on phases
  const getCurrentStatus = () => {
    if (!history) return { status: 'Unknown', description: '' };
    
    // Check if all phases are completed
    const allPhasesCompleted = history.phases.every(p => p.status === 'Completed');
    if (allPhasesCompleted) {
      return { status: 'Completed', description: 'All research phases completed' };
    }

    // Find the current phase (first In Progress phase)
    const currentPhase = history.phases.find(p => p.status === 'In Progress');
    if (currentPhase) {
      return { status: currentPhase.phase_name, description: 'Currently in progress' };
    }

    // Find the last completed phase to determine what's next
    const lastCompletedPhaseIndex = history.phases.map(p => p.status).lastIndexOf('Completed');
    if (lastCompletedPhaseIndex >= 0 && lastCompletedPhaseIndex < history.phases.length - 1) {
      const nextPhase = history.phases[lastCompletedPhaseIndex + 1];
      return { status: nextPhase.phase_name, description: 'Next phase' };
    }

    // Default to database status
    return { status: history.proposal.current_status, description: '' };
  };

  const ungroupedFiles = history?.all_files.filter(
    (file) => !history.phases.some((phase) => phase.files.some((phaseFile) => phaseFile.file_url === file.file_url && phaseFile.file_name === file.file_name))
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading researcher history...</p>
        </div>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load researcher history</p>
          <button
            onClick={() => navigate('/chairperson/researcher-history')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/chairperson/researcher-history')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Researcher History
          </button>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {history.proposal.proposal_title}
                </h1>
                <p className="text-gray-600 mb-4">{history.proposal.description}</p>
                
                <div className="flex flex-wrap gap-x-6 gap-y-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Researcher</p>
                      <p className="text-sm font-medium text-gray-900">
                        {history.researcher.fname} {history.researcher.lname}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDateShort(history.proposal.submission_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Protocol Code</p>
                      <p className="text-sm font-medium text-gray-900">
                        {history.proposal.protocol_code || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="text-sm font-medium text-gray-900">
                        {history.proposal.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 max-w-md">
                    <Users className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Reviewers</p>
                      <p className="text-sm font-medium text-gray-900 break-words whitespace-normal">
                        {history.proposal.reviewer_names && history.proposal.reviewer_names.length > 0
                          ? history.proposal.reviewer_names.join(', ')
                          : 'Unassigned'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ml-4">
                {(() => {
                  const currentStatus = getCurrentStatus();
                  const isCompleted = currentStatus.status === 'Completed';
                  
                  return (
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        isCompleted
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        {currentStatus.status}
                      </span>
                      {currentStatus.description && (
                        <p className="text-xs text-gray-500 mt-1">{currentStatus.description}</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Files</p>
                <p className="text-2xl font-bold text-gray-900">{history.all_files.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{history.review_recommendations.length}</p>
              </div>
              <FileCheck className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-lg mb-6">
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="phases" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Phases
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Files ({history.all_files.length})
            </TabsTrigger>
          </TabsList>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Complete Timeline</h2>
              
              {history.timeline.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No timeline events yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.timeline.map((event, index) => (
                    <div key={event.event_id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {getEventIcon(event.event_type)}
                        </div>
                        {index < history.timeline.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 min-h-8 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{event.event_title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{event.event_description}</p>
                            {event.user_name && (
                              <p className="text-xs text-gray-500 mt-1">by {event.user_name}</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-gray-500">{formatDate(event.event_date)}</p>
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 mt-1">
                              {event.phase}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Phases Tab */}
          <TabsContent value="phases">
            <div className="space-y-6">
              {history.phases.map((phase) => (
                <div key={phase.phase_number} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${getPhaseColor(phase.status)} flex items-center justify-center text-white`}>
                          {getPhaseIcon(phase.phase_number)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{phase.phase_name}</h3>
                          <p className="text-sm text-gray-500">Phase {phase.phase_number}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        phase.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        phase.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {phase.status}
                      </span>
                    </div>

                    {phase.start_date && (
                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Started: {formatDateShort(phase.start_date)}</span>
                        </div>
                        {phase.end_date && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Completed: {formatDateShort(phase.end_date)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Files Uploaded</p>
                        <p className="text-xl font-bold text-gray-900">{phase.files.length}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Comments</p>
                        <p className="text-xl font-bold text-gray-900">{phase.comments.length}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Revisions</p>
                        <p className="text-xl font-bold text-gray-900">{phase.revisions}</p>
                      </div>
                    </div>

                    {phase.files.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Files in this phase</h4>
                        <div className="space-y-2">
                          {phase.files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                {file.file_url && file.file_url.trim() !== '' ? (
                                  <button
                                    onClick={() => downloadFile(file.file_url, file.file_name)}
                                    className="text-sm text-blue-700 hover:text-blue-900 hover:underline text-left"
                                    title="Open or download file"
                                  >
                                    {file.file_name}
                                  </button>
                                ) : (
                                  <span className="text-sm text-gray-900">{file.file_name}</span>
                                )}
                                {file.revision_number && file.revision_number > 0 && (
                                  <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 rounded">
                                    Rev. {file.revision_number}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{formatDateShort(file.uploaded_at)}</span>
                                {file.file_url && file.file_url.trim() !== '' ? (
                                  <button
                                    onClick={() => downloadFile(file.file_url, file.file_name)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                    title="Open or download file"
                                  >
                                    <Download className="w-4 h-4 text-gray-600" />
                                  </button>
                                ) : (
                                  <span className="text-xs text-orange-600" title="File path not available">
                                    No file path
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">All Files</h2>
              
              {history.all_files.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.all_files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          {file.file_url && file.file_url.trim() !== '' ? (
                            <button
                              onClick={() => downloadFile(file.file_url, file.file_name)}
                              className="font-medium text-blue-700 hover:text-blue-900 hover:underline text-left"
                              title="Open or download file"
                            >
                              {file.file_name}
                            </button>
                          ) : (
                            <p className="font-medium text-gray-900">{file.file_name}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">{file.file_type}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{file.phase}</span>
                            {file.revision_number && file.revision_number > 0 && (
                              <>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 rounded">
                                  Revision {file.revision_number}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{formatDateShort(file.uploaded_at)}</span>
                        {file.file_url && file.file_url.trim() !== '' ? (
                          <button
                            onClick={() => downloadFile(file.file_url, file.file_name)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Open or download file"
                          >
                            <Eye className="w-5 h-5 text-gray-600" />
                          </button>
                        ) : (
                          <span className="text-xs text-orange-600">No file path</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {ungroupedFiles.length > 0 && (
                    <div className="mt-4 p-4 border border-amber-200 bg-amber-50 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-2">Unassigned Phase Files</p>
                      <p className="text-xs text-amber-700 mb-3">
                        These files are uploaded by the researcher but could not be matched to a specific phase.
                      </p>
                      <div className="space-y-2">
                        {ungroupedFiles.map((file, idx) => (
                          <div key={`ungrouped-${idx}`} className="flex items-center justify-between bg-white border border-amber-200 rounded px-3 py-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-700" />
                              <span className="text-sm text-gray-900">{file.file_name}</span>
                            </div>
                            {file.file_url && file.file_url.trim() !== '' ? (
                              <button
                                onClick={() => downloadFile(file.file_url, file.file_name)}
                                className="p-1 hover:bg-amber-100 rounded"
                                title="Open or download file"
                              >
                                <Download className="w-4 h-4 text-amber-700" />
                              </button>
                            ) : (
                              <span className="text-xs text-orange-600">No file path</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
