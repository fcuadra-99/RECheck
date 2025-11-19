// Type definitions for Researcher History feature

export interface ResearcherProfile {
  id: string;
  fname: string;
  lname: string;
  email: string;
  org?: string;
}

export interface ProposalSummary {
  proposal_id: number;
  proposal_title: string;
  description: string;
  category: string;
  researcher_id: string;
  researcher_name: string;
  current_status: string;
  submission_date: string;
  last_updated: string;
  review_type?: string;
  completed: boolean;
}

export interface FileRecord {
  file_id?: number;
  file_name: string;
  file_url: string;
  file_type: string;
  phase: string;
  uploaded_at: string;
  revision_number?: number;
}

export interface CommentRecord {
  comment_id?: number;
  comment_text: string;
  commented_by: string;
  commenter_name?: string;
  commenter_role?: string;
  comment_date: string;
  phase: string;
  action_type?: string;
}

export interface HistoryRecord {
  history_id: number;
  paper_id: number;
  history_date: string;
  history_type: string;
  history_comment: string;
  history_action: string;
  user_id?: string;
  user_name?: string;
  reviewer_id?: string;
  reviewer_name?: string;
  status_before?: string;
  status_after?: string;
  phase?: string;
}

export interface DeviationRecord {
  deviation_id: number;
  proposal_id: number;
  deviation_type: string;
  deviation_description: string;
  submitted_at: string;
  status: string;
  chairperson_decision?: string;
  chairperson_comments?: string;
  reviewed_at?: string;
}

export interface FinalReportRecord {
  report_id: number;
  proposal_id: number;
  report_type: string;
  submitted_at: string;
  status: string;
  outcome?: string;
  comments?: string;
  reviewed_at?: string;
  last_updated_at?: string;
  attachments?: string[];
}

export interface ReviewRecommendation {
  recommendation_id?: number;
  reviewer_id: string;
  reviewer_name: string;
  recommendation: string;
  comments?: string;
  submitted_at: string;
  phase: string;
}

export interface PhaseData {
  phase_name: string;
  phase_number: number;
  status: string;
  start_date?: string;
  end_date?: string;
  files: FileRecord[];
  comments: CommentRecord[];
  history: HistoryRecord[];
  revisions: number;
}

export interface ComprehensiveResearcherHistory {
  researcher: ResearcherProfile;
  proposal: ProposalSummary;
  phases: PhaseData[];
  all_files: FileRecord[];
  all_comments: CommentRecord[];
  all_history: HistoryRecord[];
  deviations: DeviationRecord[];
  final_reports: FinalReportRecord[];
  review_recommendations: ReviewRecommendation[];
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  event_id: string;
  event_date: string;
  event_type: 'status_change' | 'file_upload' | 'comment' | 'review' | 'deviation' | 'final_report';
  event_title: string;
  event_description: string;
  phase: string;
  user_name?: string;
  user_role?: string;
  metadata?: any;
}

export interface ResearcherHistoryFilters {
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}
