import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { researcherHistoryService } from '../../services/researcherHistoryService';
import type { ComprehensiveResearcherHistory } from '../../types/researcherHistory';
import { supabase } from '../../DB';
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

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      console.log('Attempting to download file:', { fileUrl, fileName });
      
      // Validate file URL
      if (!fileUrl || fileUrl.trim() === '') {
        alert('File path is missing. This file may not have been uploaded correctly.');
        return;
      }
      
      // Clean up the file path - remove any leading slashes
      let cleanPath = fileUrl.trim();
      if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
      }
      
      console.log('Cleaned path:', cleanPath);
      
      // Determine which bucket to use based on the file path
      // Final reports are in 'storage' bucket, proposal documents are in 'documents' bucket
      let bucketName = 'documents'; // default
      if (cleanPath.includes('final-reports') || cleanPath.includes('final_reports')) {
        bucketName = 'storage';
      }
      
      console.log('Using bucket:', bucketName);
      
      // Download the file
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(cleanPath);
      
      if (error) {
        console.error('Supabase storage error:', error);
        // If it failed with one bucket, try the other
        if (bucketName === 'documents') {
          console.log('Retrying with storage bucket...');
          const retry = await supabase.storage.from('storage').download(cleanPath);
          if (retry.error) {
            console.error('Retry also failed:', retry.error);
            alert(`Failed to download file. The file may have been moved or deleted.\n\nPath: ${cleanPath}\nError: ${JSON.stringify(retry.error)}`);
            return;
          }
          if (!retry.data) {
            throw new Error('No file data received');
          }
          // Success with storage bucket
          const url = window.URL.createObjectURL(retry.data);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          return;
        } else {
          // Try documents bucket as fallback
          console.log('Retrying with documents bucket...');
          const retry = await supabase.storage.from('documents').download(cleanPath);
          if (retry.error) {
            console.error('Retry also failed:', retry.error);
            alert(`Failed to download file. The file may have been moved or deleted.\n\nPath: ${cleanPath}\nError: ${JSON.stringify(retry.error)}`);
            return;
          }
          if (!retry.data) {
            throw new Error('No file data received');
          }
          // Success with documents bucket
          const url = window.URL.createObjectURL(retry.data);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          return;
        }
      }
      
      if (!data) {
        throw new Error('No file data received');
      }
      
      console.log('File downloaded successfully, size:', data.size);
      
      // Create a download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Researcher</p>
                      <p className="text-sm font-medium text-gray-900">
                        {history.researcher.fname} {history.researcher.lname}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDateShort(history.proposal.submission_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="text-sm font-medium text-gray-900">
                        {history.proposal.category}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <p className="text-xs text-gray-500 uppercase tracking-wide">Comments</p>
                <p className="text-2xl font-bold text-gray-900">{history.all_comments.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Deviations</p>
                <p className="text-2xl font-bold text-gray-900">{history.deviations.length}</p>
              </div>
              <Flag className="w-8 h-8 text-red-500" />
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
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments ({history.all_comments.length})
            </TabsTrigger>
            <TabsTrigger value="deviations" className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              Deviations ({history.deviations.length})
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
                                <span className="text-sm text-gray-900">{file.file_name}</span>
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
                                    title="Download file"
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
                          <p className="font-medium text-gray-900">{file.file_name}</p>
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
                        <button
                          onClick={() => downloadFile(file.file_url, file.file_name)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">All Comments & Feedback</h2>
              
              {history.all_comments.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No comments yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.all_comments.map((comment, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-gray-900">{comment.commenter_name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(comment.comment_date)}</span>
                      </div>
                      <p className="text-gray-700 mb-2">{comment.comment_text}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {comment.phase}
                        </span>
                        {comment.action_type && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {comment.action_type}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Deviations Tab */}
          <TabsContent value="deviations">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Deviations & Reports</h2>
              
              {history.deviations.length === 0 ? (
                <div className="text-center py-12">
                  <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No deviations reported</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.deviations.map((deviation) => (
                    <div key={deviation.deviation_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Flag className="w-5 h-5 text-red-600" />
                          <span className="font-medium text-gray-900">{deviation.deviation_type}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          deviation.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          deviation.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {deviation.status}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{deviation.deviation_description}</p>
                      {deviation.chairperson_comments && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-2">
                          <p className="text-xs text-gray-500 mb-1">Chairperson Comments:</p>
                          <p className="text-sm text-gray-900">{deviation.chairperson_comments}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Submitted: {formatDateShort(deviation.submitted_at)}</span>
                        {deviation.reviewed_at && (
                          <span>Reviewed: {formatDateShort(deviation.reviewed_at)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Final Reports Section */}
              {history.final_reports.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Reports</h3>
                  <div className="space-y-4">
                    {history.final_reports.map((report) => (
                      <div key={report.report_id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Archive className="w-5 h-5 text-gray-600" />
                            <span className="font-medium text-gray-900">{report.report_type}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            report.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            report.status === 'Requires Revision' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        {report.outcome && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-2">
                            <p className="text-xs text-gray-500 mb-1">Outcome:</p>
                            <p className="text-sm text-gray-900">{report.outcome}</p>
                          </div>
                        )}
                        {report.comments && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-2">
                            <p className="text-xs text-gray-500 mb-1">Comments:</p>
                            <p className="text-sm text-gray-900">{report.comments}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Submitted: {formatDateShort(report.submitted_at)}</span>
                          {report.reviewed_at && (
                            <span>Reviewed: {formatDateShort(report.reviewed_at)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
