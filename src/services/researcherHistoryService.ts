import { supabase } from '../DB';
import type {
  ResearcherProfile,
  ProposalSummary,
  FileRecord,
  CommentRecord,
  HistoryRecord,
  DeviationRecord,
  FinalReportRecord,
  ReviewRecommendation,
  PhaseData,
  ComprehensiveResearcherHistory,
  TimelineEvent,
  ResearcherHistoryFilters
} from '../types/researcherHistory';

/**
 * Service for fetching comprehensive researcher history data
 */
export class ResearcherHistoryService {
  /**
   * Get all proposals with researcher information
   */
  async getAllProposals(filters?: ResearcherHistoryFilters): Promise<ProposalSummary[]> {
    try {
      let query = supabase
        .from('proposals')
        .select(`
          proposal_id,
          protocol_id,
          proposal_title,
          description,
          category,
          researcher,
          reviewer,
          status,
          date,
          updated_on,
          review_type
        `)
        .order('date', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('date', filters.dateTo);
      }

      const { data: proposals, error } = await query;

      if (error) {
        console.error('Error fetching proposals:', error);
        return [];
      }

      console.log('Fetched proposals from database:', proposals?.length || 0);

      if (!proposals || proposals.length === 0) return [];

      // Fetch researcher and reviewer profiles for all proposals
      const researcherIds = proposals.map(p => p.researcher);
      const reviewerIdsSet = new Set<string>();
      proposals.forEach(p => {
        if (p.reviewer) {
          let rawReviewers: any = p.reviewer;
          if (typeof rawReviewers === 'string' && (rawReviewers.startsWith('[') || rawReviewers.startsWith('{'))) {
            try {
              rawReviewers = JSON.parse(rawReviewers);
            } catch {
              // ignore
            }
          }
          if (Array.isArray(rawReviewers)) {
            rawReviewers.forEach((id: any) => {
              if (typeof id === 'string') reviewerIdsSet.add(id);
            });
          } else if (typeof rawReviewers === 'string') {
            reviewerIdsSet.add(rawReviewers);
          }
        }
      });
      const allProfileIds = [...new Set([...researcherIds, ...Array.from(reviewerIdsSet)])].filter(Boolean);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, fname, lname, email')
        .in('id', allProfileIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Map proposals with researcher and reviewer names
      const proposalsWithResearchers: ProposalSummary[] = proposals.map(proposal => {
        const profile = profileMap.get(proposal.researcher);
        
        // Resolve reviewers
        const reviewersList: string[] = [];
        if (proposal.reviewer) {
          let rawReviewers: any = proposal.reviewer;
          if (typeof rawReviewers === 'string' && (rawReviewers.startsWith('[') || rawReviewers.startsWith('{'))) {
            try {
              rawReviewers = JSON.parse(rawReviewers);
            } catch {
              // ignore
            }
          }
          if (Array.isArray(rawReviewers)) {
            rawReviewers.forEach((rId: any) => {
              const rProfile = profileMap.get(rId);
              if (rProfile) {
                reviewersList.push(`${rProfile.fname} ${rProfile.lname}`);
              } else {
                reviewersList.push(rId);
              }
            });
          } else if (typeof rawReviewers === 'string') {
            const rProfile = profileMap.get(rawReviewers);
            if (rProfile) {
              reviewersList.push(`${rProfile.fname} ${rProfile.lname}`);
            } else {
              reviewersList.push(rawReviewers);
            }
          }
        }

        return {
          proposal_id: proposal.proposal_id,
          protocol_code: proposal.protocol_id || null,
          proposal_title: proposal.proposal_title,
          description: proposal.description,
          category: proposal.category,
          researcher_id: proposal.researcher,
          researcher_name: profile ? `${profile.fname} ${profile.lname}` : 'Unknown',
          reviewer_names: reviewersList,
          current_status: proposal.status,
          submission_date: proposal.date,
          last_updated: proposal.updated_on || proposal.date,
          review_type: proposal.review_type,
          completed: this.isProposalCompleted(proposal.status)
        };
      });

      // Apply search term filter if provided
      if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return proposalsWithResearchers.filter(p =>
          p.proposal_title.toLowerCase().includes(searchLower) ||
          p.researcher_name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          (p.protocol_code || '').toLowerCase().includes(searchLower) ||
          (p.reviewer_names || []).some(name => name.toLowerCase().includes(searchLower))
        );
      }

      return proposalsWithResearchers;
    } catch (error) {
      console.error('Error in getAllProposals:', error);
      return [];
    }
  }

  /**
   * Get comprehensive history for a specific proposal/researcher
   */
  async getComprehensiveHistory(proposalId: number): Promise<ComprehensiveResearcherHistory | null> {
    try {
      // Fetch proposal details
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('proposal_id', proposalId)
        .single();

      if (proposalError || !proposal) {
        console.error('Error fetching proposal:', proposalError);
        return null;
      }

      // Fetch researcher profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, fname, lname, email, org')
        .eq('id', proposal.researcher)
        .single();

      const researcher: ResearcherProfile = {
        id: proposal.researcher,
        fname: profile?.fname || 'Unknown',
        lname: profile?.lname || '',
        email: profile?.email || '',
        org: profile?.org || undefined
      };

      // Fetch all files uploaded for this proposal
      const files = await this.getProposalFiles(proposalId);
      console.log(`📁 Total files fetched: ${files.length}`, files);

      // Fetch all history records
      const history = await this.getProposalHistory(proposalId);
      console.log(`📜 Total history records: ${history.length}`);

      // Fetch comments from history
      const comments = await this.getProposalComments(proposalId);
      console.log(`💬 Total comments: ${comments.length}`, comments);

      // Fetch deviations
      const deviations = await this.getProposalDeviations(proposalId);

      // Fetch final reports
      const finalReports = await this.getProposalFinalReports(proposalId);
      console.log(`📊 Total final reports fetched: ${finalReports.length}`, finalReports);

      // Fetch review recommendations
      const reviewRecommendations = await this.getReviewRecommendations(proposalId);

      // Group data by phases
      const phases = this.groupDataByPhases(proposal.status, files, comments, history, finalReports);

      // Create timeline
      const timeline = this.createTimeline(files, comments, history, deviations, finalReports, reviewRecommendations);

      // Resolve reviewers
      const reviewerNamesList: string[] = [];
      const reviewerIdsList: string[] = [];
      if (proposal.reviewer) {
        let rawReviewers: any = proposal.reviewer;
        if (typeof rawReviewers === 'string' && (rawReviewers.startsWith('[') || rawReviewers.startsWith('{'))) {
          try {
            rawReviewers = JSON.parse(rawReviewers);
          } catch {
            // ignore
          }
        }
        if (Array.isArray(rawReviewers)) {
          rawReviewers.forEach((id: any) => {
            if (typeof id === 'string') reviewerIdsList.push(id);
          });
        } else if (typeof rawReviewers === 'string') {
          reviewerIdsList.push(rawReviewers);
        }
      }

      if (reviewerIdsList.length > 0) {
        const { data: revProfiles } = await supabase
          .from('profiles')
          .select('fname, lname, id')
          .in('id', reviewerIdsList);
        
        const revProfileMap = new Map(revProfiles?.map(p => [p.id, `${p.fname} ${p.lname}`]) || []);
        reviewerIdsList.forEach(rId => {
          reviewerNamesList.push(revProfileMap.get(rId) || rId);
        });
      }

      const proposalSummary: ProposalSummary = {
        proposal_id: proposal.proposal_id,
        protocol_code: proposal.protocol_id || null,
        proposal_title: proposal.proposal_title,
        description: proposal.description,
        category: proposal.category,
        researcher_id: proposal.researcher,
        researcher_name: `${researcher.fname} ${researcher.lname}`,
        reviewer_names: reviewerNamesList,
        current_status: proposal.status,
        submission_date: proposal.date,
        last_updated: proposal.updated_on || proposal.date,
        review_type: proposal.review_type,
        completed: this.isProposalCompleted(proposal.status)
      };

      // Include final report attachments in all_files
      const finalReportAttachmentFiles = finalReports.flatMap(report =>
        (report.attachments || []).map((filePath: string, index: number) => ({
          file_id: undefined,
          file_name: this.extractFileName(filePath),
          file_url: filePath,
          file_type: 'Final Report Attachment',
          phase: 'Phase 7: Final Report Submission',
          uploaded_at: report.submitted_at,
          revision_number: index
        }))
      );

      const allFilesWithAttachments = [...files, ...finalReportAttachmentFiles];

      return {
        researcher,
        proposal: proposalSummary,
        phases,
        all_files: allFilesWithAttachments,
        all_comments: comments,
        all_history: history,
        deviations,
        final_reports: finalReports,
        review_recommendations: reviewRecommendations,
        timeline
      };
    } catch (error) {
      console.error('Error in getComprehensiveHistory:', error);
      return null;
    }
  }

  /**
   * Get all files uploaded for a proposal across all phases
   */
  private async getProposalFiles(proposalId: number): Promise<FileRecord[]> {
    try {
      const { data: documents } = await supabase
        .from('proposal_documents')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('uploaded_at', { ascending: true });

      const { data: formDataRows } = await supabase
        .from('form_data')
        .select('form_name, revision_number')
        .eq('proposal_id', proposalId);

      if (!documents) return [];

      const fileRecords = documents.map(doc => {
        const phaseFromType = this.getPhaseFromDocType(doc.doc_type);
        const phase = phaseFromType === 'Unknown Phase'
          ? this.getPhaseFromFilePath(doc.file_path)
          : phaseFromType;

        const normalizedDocType = (doc.doc_type || '').trim().toLowerCase();
        const docRev = doc.revision_number || 1;
        const hasSavedFormData = (formDataRows || []).some(row =>
          (row.form_name || '').trim().toLowerCase() === normalizedDocType &&
          (row.revision_number || 1) === docRev
        );

        let resolvedFormName = doc.doc_type || this.extractFileName(doc.file_path || 'Form Data');
        resolvedFormName = `v${docRev}_${resolvedFormName}`;

        const resolvedFilePath = doc.file_path || (hasSavedFormData
          ? this.buildFormDataVirtualPath(proposalId, resolvedFormName)
          : '');

        return {
          file_id: doc.document_id,
          file_name: doc.file_name || this.extractFileName(doc.file_path),
          file_url: resolvedFilePath,
          file_type: doc.doc_type || 'Unknown',
          phase,
          uploaded_at: doc.uploaded_at || new Date().toISOString(),
          revision_number: doc.revision_number || 0
        };
      });

      console.log('📋 File records with phases:', fileRecords.map(f => ({ 
        name: f.file_name, 
        type: f.file_type, 
        phase: f.phase,
        url: f.file_url,
        uploaded: f.uploaded_at
      })));
      
      // Log documents that didn't match Phase 3
      const unknownPhase = fileRecords.filter(f => f.phase === 'Unknown Phase');
      if (unknownPhase.length > 0) {
        console.warn('⚠️ Documents with Unknown Phase:', unknownPhase.map(f => ({ type: f.file_type, name: f.file_name })));
      }

      // Fetch additional files from storage buckets for phases that might be missing file_path
      try {
        const storageFiles = await this.fetchFilesFromStorage(proposalId);
        console.log(`📦 Additional files from storage: ${storageFiles.length}`);
        console.log('Storage files:', storageFiles.map(f => ({ name: f.file_name, type: f.file_type, phase: f.phase, url: f.file_url })));
        
        // Merge storage files with database records (avoid duplicates)
        // Only add storage files if they don't have a corresponding database record
        const allFiles = [...fileRecords];
        for (const storageFile of storageFiles) {
          // Check multiple conditions to avoid duplicates:
          // 1. Same file_type (doc_type in database)
          // 2. Same phase
          // 3. Or if database record has empty file_url, replace it with storage version
          const dbMatch = fileRecords.find(f => {
            const typeMatch = f.file_type === storageFile.file_type || f.file_name === storageFile.file_name;
            const phaseMatch = f.phase === storageFile.phase;
            console.log(`Comparing: "${f.file_name}" (${f.file_type}) vs "${storageFile.file_name}" (${storageFile.file_type}) - typeMatch: ${typeMatch}, phaseMatch: ${phaseMatch}`);
            return typeMatch && phaseMatch;
          });
          
          if (!dbMatch) {
            // No matching database record, add storage file
            const fileToAdd = {
              file_id: storageFile.file_id,
              file_name: storageFile.file_name,
              file_url: storageFile.file_url,
              file_type: storageFile.file_type,
              phase: storageFile.phase,
              uploaded_at: storageFile.uploaded_at,
              revision_number: storageFile.revision_number || 0
            };
            allFiles.push(fileToAdd);
            console.log(`✅ Adding storage file: ${storageFile.file_name}`);
          } else if (!dbMatch.file_url || dbMatch.file_url.trim() === '') {
            // Database record exists but has no file_url, update it with storage path
            const index = allFiles.findIndex(f => f === dbMatch);
            if (index !== -1) {
              allFiles[index] = { ...dbMatch, file_url: storageFile.file_url };
              console.log(`🔄 Updated file_url for: ${dbMatch.file_name}`);
            }
          } else {
            console.log(`⏭️ Skipping duplicate: ${storageFile.file_name}`);
          }
        }
        
        console.log(`📋 Total files (database + storage): ${allFiles.length}`);
        
        return allFiles;
      } catch (storageError) {
        console.error('Error fetching from storage, using database records only:', storageError);
        return fileRecords;
      }
    } catch (error) {
      console.error('Error fetching proposal files:', error);
      return [];
    }
  }

  /**
   * Fetch files directly from storage buckets
   */
  private async fetchFilesFromStorage(proposalId: number): Promise<FileRecord[]> {
    const storageFiles: FileRecord[] = [];
    
    const phases = [
      { folder: 'Send Manuscript', phase: 'Phase 1: Manuscript Submission' },
      { folder: 'Send Forms', phase: 'Phase 3: Forms Submission' },
      { folder: 'Send Revision', phase: 'Phase 4: Deployment Queue' }
    ];

    for (const { folder, phase } of phases) {
      try {
        const { data: files, error } = await supabase.storage
          .from('documents')
          .list(`${proposalId}/${folder}`, { limit: 1000, offset: 0 });

        if (error) {
          console.warn(`Could not list files for ${folder}:`, error);
          continue;
        }

        if (files) {
          const validFiles = files.filter(f => {
            const lowerName = f.name.toLowerCase();
            return (
              !f.name.startsWith('.') &&
              !lowerName.includes('emptyfolderplaceholder') &&
              !lowerName.endsWith('/') &&
              !!f.name.trim()
            );
          });

          for (const file of validFiles) {
            const fileRecord: FileRecord = {
              file_name: this.extractFileName(file.name),
              file_url: `${proposalId}/${folder}/${file.name}`,
              file_type: this.extractFileName(file.name),
              phase,
              uploaded_at: file.created_at || new Date().toISOString(),
              revision_number: 0
            };
            storageFiles.push(fileRecord);
          }
        }
      } catch (err) {
        console.warn(`Error fetching storage files for ${folder}:`, err);
      }
    }

    return storageFiles;
  }

  /**
   * Get all history records for a proposal
   */
  private async getProposalHistory(proposalId: number): Promise<HistoryRecord[]> {
    try {
      const { data: historyRecords } = await supabase
        .from('history')
        .select('*')
        .eq('paper_id', proposalId)
        .order('history_date', { ascending: true });

      if (!historyRecords) return [];

      // Fetch user names for history records
      const userIds = [...new Set(historyRecords
        .map(h => h.user_id)
        .filter(Boolean))] as string[];

      const reviewerIds = [...new Set(historyRecords
        .map(h => h.reviewer_id)
        .filter(Boolean))] as string[];

      const allUserIds = [...new Set([...userIds, ...reviewerIds])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, fname, lname')
        .in('id', allUserIds);

      const profileMap = new Map(profiles?.map(p => [p.id, `${p.fname} ${p.lname}`]) || []);

      return historyRecords.map(record => ({
        history_id: record.history_id,
        paper_id: record.paper_id,
        history_date: record.history_date,
        history_type: record.history_type,
        history_comment: record.history_comment,
        history_action: record.history_action,
        user_id: record.user_id,
        user_name: record.user_id ? profileMap.get(record.user_id) : undefined,
        reviewer_id: record.reviewer_id,
        reviewer_name: record.reviewer_id ? profileMap.get(record.reviewer_id) : undefined,
        status_before: record.status_before,
        status_after: record.status_after,
        phase: this.getPhaseFromStatus(record.status_after || record.status_before || '')
      }));
    } catch (error) {
      console.error('Error fetching proposal history:', error);
      return [];
    }
  }

  /**
   * Get all comments from history
   */
  private async getProposalComments(proposalId: number): Promise<CommentRecord[]> {
    try {
      const { data: historyRecords } = await supabase
        .from('history')
        .select('*')
        .eq('paper_id', proposalId)
        .not('history_comment', 'is', null)
        .not('history_comment', 'eq', '')
        .order('history_date', { ascending: true });

      if (!historyRecords) return [];

      // Fetch user profiles
      const userIds = [...new Set(historyRecords
        .map(h => h.user_id || h.reviewer_id)
        .filter(Boolean))] as string[];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, fname, lname')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return historyRecords.map((record) => {
        const userId = record.user_id || record.reviewer_id;
        const profile = userId ? profileMap.get(userId) : null;
        
        return {
          comment_id: record.history_id,
          comment_text: record.history_comment,
          commented_by: userId || 'System',
          commenter_name: profile ? `${profile.fname} ${profile.lname}` : 'System',
          comment_date: record.history_date,
          phase: this.getPhaseFromStatus(record.status_after || record.status_before || ''),
          action_type: record.history_action
        };
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  /**
   * Get deviations for a proposal
   */
  private async getProposalDeviations(proposalId: number): Promise<DeviationRecord[]> {
    try {
      const { data: deviations } = await supabase
        .from('deviation_reports')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('submitted_at', { ascending: true });

      if (!deviations) return [];

      return deviations.map(dev => ({
        deviation_id: dev.id,
        proposal_id: dev.proposal_id,
        deviation_type: dev.deviation_type,
        deviation_description: dev.description,
        submitted_at: dev.submitted_at,
        status: dev.status,
        chairperson_decision: dev.chairperson_decision,
        chairperson_comments: dev.chairperson_comments,
        reviewed_at: dev.reviewed_at
      }));
    } catch (error) {
      console.error('Error fetching deviations:', error);
      return [];
    }
  }

  /**
   * Get final reports for a proposal
   */
  private async getProposalFinalReports(proposalId: number): Promise<FinalReportRecord[]> {
    try {
      // First get the proposal date for this proposal_id
      const { data: proposal } = await supabase
        .from('proposals')
        .select('date')
        .eq('proposal_id', proposalId)
        .single();

      if (!proposal) return [];

      // Query final_reports by proposal_date (not proposal_id)
      const { data: reports } = await supabase
        .from('final_reports')
        .select('*')
        .eq('proposal_date', proposal.date)
        .order('submitted_at', { ascending: true });

      if (!reports) return [];

      return reports.map(report => ({
        report_id: report.id,
        proposal_id: proposalId, // Use the actual proposal_id for consistency
        report_type: report.report_type || 'Final Report',
        submitted_at: report.submitted_at,
        status: report.status,
        outcome: report.outcome,
        comments: report.comments,
        reviewed_at: report.reviewed_at,
        last_updated_at: report.last_updated_at,
        attachments: report.attachments || []
      }));
    } catch (error) {
      console.error('Error fetching final reports:', error);
      return [];
    }
  }

  /**
   * Get review recommendations
   */
  private async getReviewRecommendations(proposalId: number): Promise<ReviewRecommendation[]> {
    try {
      const { data: recommendations } = await supabase
        .from('history')
        .select('*')
        .eq('paper_id', proposalId)
        .eq('history_type', 'review_recommendation')
        .order('history_date', { ascending: true });

      if (!recommendations) return [];

      // Fetch reviewer profiles
      const reviewerIds = [...new Set(recommendations
        .map(r => r.reviewer_id)
        .filter(Boolean))] as string[];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, fname, lname')
        .in('id', reviewerIds);

      const profileMap = new Map(profiles?.map(p => [p.id, `${p.fname} ${p.lname}`]) || []);

      return recommendations.map(rec => ({
        recommendation_id: rec.history_id,
        reviewer_id: rec.reviewer_id || '',
        reviewer_name: rec.reviewer_id ? profileMap.get(rec.reviewer_id) || 'Unknown' : 'Unknown',
        recommendation: rec.history_action,
        comments: rec.history_comment,
        submitted_at: rec.history_date,
        phase: 'Phase 5: Documents Review'
      }));
    } catch (error) {
      console.error('Error fetching review recommendations:', error);
      return [];
    }
  }

  /**
   * Group data by research phases
   */
  private groupDataByPhases(
    currentStatus: string,
    files: FileRecord[],
    comments: CommentRecord[],
    history: HistoryRecord[],
    finalReports: FinalReportRecord[] = []
  ): PhaseData[] {
    const phases = [
      { name: 'Phase 1: Manuscript Submission', number: 1, statuses: ['Send Manuscript', 'Check Manuscript', 'Resend Manuscript'] },
      { name: 'Phase 2: Risk Assessment', number: 2, statuses: ['Risk Assessment'] },
      { name: 'Phase 3: Forms Submission', number: 3, statuses: ['Send Forms', 'Forms Check', 'Resend Forms'] },
      { name: 'Phase 4: Deployment Queue', number: 4, statuses: ['Deploy Queue', 'Send Revision', 'Check Revision', 'Resend Revision'] },
      { name: 'Phase 5: Documents Review', number: 5, statuses: ['Assign Review', 'Proposal Review', 'Revise Proposal'] },
      { name: 'Phase 6: Data Collection & Reporting', number: 6, statuses: ['Data Collection', 'Deviation Check', 'Send Deviation Report', 'Send Study Report', 'Revise Documents', 'Study Report Check'] },
      { name: 'Phase 7: Final Report Submission', number: 7, statuses: [] } // Special handling for final reports
    ];

    return phases.map(phase => {
      // Special handling for Phase 7 - Final Report Submission
      if (phase.number === 7) {
        // Phase 7 is based on final report submissions, not status
        // Include files from the final_reports table attachments and matching phase files
        const phase7Files = files.filter(f => 
          f.phase.includes('Final Report') || 
          f.file_type.toLowerCase().includes('final') ||
          f.file_type.toLowerCase().includes('study report') ||
          f.file_name.toLowerCase().includes('final report') ||
          f.file_name.toLowerCase().includes('study report')
        );
        
        // Add files from final report attachments
        const attachmentFiles = finalReports.flatMap(report => 
          (report.attachments || []).map((filePath: string, index: number) => ({
            file_id: undefined,
            file_name: this.extractFileName(filePath),
            file_url: filePath,
            file_type: 'Final Report Attachment',
            phase: 'Phase 7: Final Report Submission',
            uploaded_at: report.submitted_at,
            revision_number: index
          }))
        );
        
        const allPhase7Files = [...phase7Files, ...attachmentFiles];
        
        console.log('Phase 7 final reports count:', finalReports.length);
        console.log('Phase 7 matched files from proposal_documents:', phase7Files.length);
        console.log('Phase 7 attachment files from final_reports:', attachmentFiles.length);
        console.log('Phase 7 total files:', allPhase7Files.length);
        
        // Get comments related to final reports from history
        const phase7Comments = comments.filter(c => 
          c.comment_text.toLowerCase().includes('final report') ||
          c.action_type?.includes('final_report')
        );
        
        // Get history entries related to final reports
        const phase7History = history.filter(h =>
          h.history_type?.includes('final_report') ||
          h.history_comment?.toLowerCase().includes('final report')
        );

        // Determine phase status based on final reports
        let phaseStatus = 'Not Started';
        let startDate: string | undefined;
        let endDate: string | undefined;
        let revisions = 0;

        if (finalReports.length > 0) {
          phaseStatus = 'In Progress';
          startDate = finalReports[0].submitted_at;
          
          // Check if any report is approved (completed)
          const approvedReports = finalReports.filter(r => r.status === 'Approved');
          if (approvedReports.length > 0) {
            phaseStatus = 'Completed';
            endDate = approvedReports[approvedReports.length - 1].reviewed_at || approvedReports[approvedReports.length - 1].submitted_at;
          }
          
          // Count revisions (reports after the first one)
          revisions = finalReports.length > 1 ? finalReports.length - 1 : 0;
        }

        return {
          phase_name: phase.name,
          phase_number: phase.number,
          status: phaseStatus,
          start_date: startDate,
          end_date: endDate,
          files: allPhase7Files,
          comments: phase7Comments,
          history: phase7History,
          revisions
        };
      }

      // Special handling for Phase 6 - Mark as completed if final report submitted
      if (phase.number === 6) {
        // Standard file/comment/history matching for Phase 6
        const phaseFiles = files.filter(f => {
          if (f.phase === phase.name) return true;
          return phase.statuses.some(status => 
            f.phase.includes(status) || 
            f.file_type.toLowerCase().includes(status.toLowerCase())
          );
        });

        const phaseComments = comments.filter(c => {
          return phase.statuses.some(status => c.phase.includes(status));
        });

        const phaseHistory = history.filter(h => 
          phase.statuses.includes(h.status_after || '') || 
          phase.statuses.includes(h.status_before || '')
        );

        // Determine phase status - mark as completed if final report exists
        let phaseStatus = 'Not Started';
        const currentPhase = phases.find(p => p.statuses.includes(currentStatus));
        
        if (finalReports.length > 0) {
          // If final report submitted, Phase 6 is automatically completed
          phaseStatus = 'Completed';
        } else if (currentPhase && currentPhase.number > phase.number) {
          phaseStatus = 'Completed';
        } else if (currentPhase && currentPhase.number === phase.number) {
          phaseStatus = 'In Progress';
        }

        const phaseHistorySorted = phaseHistory.sort((a, b) => 
          new Date(a.history_date).getTime() - new Date(b.history_date).getTime()
        );
        const startDate = phaseHistorySorted.length > 0 ? phaseHistorySorted[0].history_date : undefined;
        const endDate = phaseStatus === 'Completed' && phaseHistorySorted.length > 0 
          ? phaseHistorySorted[phaseHistorySorted.length - 1].history_date 
          : undefined;

        const revisions = phaseFiles.filter(f => (f.revision_number || 0) > 0).length;

        return {
          phase_name: phase.name,
          phase_number: phase.number,
          status: phaseStatus,
          start_date: startDate,
          end_date: endDate,
          files: phaseFiles,
          comments: phaseComments,
          history: phaseHistory,
          revisions
        };
      }

      // Standard handling for other phases
      // Match files to this phase by checking if file's phase matches this phase name or any of its statuses
      const phaseFiles = files.filter(f => {
        // Direct phase name match
        if (f.phase === phase.name) return true;
        
        // Check if file phase contains any of the phase statuses
        return phase.statuses.some(status => 
          f.phase.includes(status) || 
          f.file_type.toLowerCase().includes(status.toLowerCase())
        );
      });

      console.log(`Phase ${phase.number} (${phase.name}): Total files in dataset: ${files.length}, Matched files: ${phaseFiles.length}`);
      if (phaseFiles.length > 0) {
        console.log(`Phase ${phase.number} matched files:`, phaseFiles.map(f => ({ name: f.file_name, phase: f.phase, type: f.file_type })));
      }

      // Match comments to this phase by checking if comment's phase matches any phase status
      const phaseComments = comments.filter(c => {
        // Check if comment phase matches any of this phase's statuses
        return phase.statuses.some(status => c.phase.includes(status));
      });

      // Match history to this phase
      const phaseHistory = history.filter(h => 
        phase.statuses.includes(h.status_after || '') || 
        phase.statuses.includes(h.status_before || '')
      );

      // Determine phase status
      let phaseStatus = 'Not Started';
      const currentPhase = phases.find(p => p.statuses.includes(currentStatus));
      
      if (currentPhase && currentPhase.number > phase.number) {
        phaseStatus = 'Completed';
      } else if (currentPhase && currentPhase.number === phase.number) {
        phaseStatus = 'In Progress';
      }

      // Get phase start and end dates from history
      const phaseHistorySorted = phaseHistory.sort((a, b) => 
        new Date(a.history_date).getTime() - new Date(b.history_date).getTime()
      );
      const startDate = phaseHistorySorted.length > 0 ? phaseHistorySorted[0].history_date : undefined;
      const endDate = phaseStatus === 'Completed' && phaseHistorySorted.length > 0 
        ? phaseHistorySorted[phaseHistorySorted.length - 1].history_date 
        : undefined;

      // Count revisions (files with revision_number > 0)
      const revisions = phaseFiles.filter(f => (f.revision_number || 0) > 0).length;

      return {
        phase_name: phase.name,
        phase_number: phase.number,
        status: phaseStatus,
        start_date: startDate,
        end_date: endDate,
        files: phaseFiles,
        comments: phaseComments,
        history: phaseHistory,
        revisions
      };
    });
  }

  /**
   * Create a timeline of all events
   */
  private createTimeline(
    files: FileRecord[],
    comments: CommentRecord[],
    history: HistoryRecord[],
    deviations: DeviationRecord[],
    finalReports: FinalReportRecord[],
    reviewRecommendations: ReviewRecommendation[]
  ): TimelineEvent[] {
    const timeline: TimelineEvent[] = [];

    // Add file uploads to timeline
    files.forEach(file => {
      timeline.push({
        event_id: `file-${file.file_id}`,
        event_date: file.uploaded_at,
        event_type: 'file_upload',
        event_title: 'File Uploaded',
        event_description: `${file.file_name} (${file.file_type})`,
        phase: file.phase,
        metadata: file
      });
    });

    // Add comments to timeline
    comments.forEach(comment => {
      timeline.push({
        event_id: `comment-${comment.comment_id}`,
        event_date: comment.comment_date,
        event_type: 'comment',
        event_title: 'Comment Added',
        event_description: comment.comment_text,
        phase: comment.phase,
        user_name: comment.commenter_name,
        metadata: comment
      });
    });

    // Add status changes to timeline
    history.forEach(h => {
      if (h.status_before && h.status_after && h.status_before !== h.status_after) {
        timeline.push({
          event_id: `status-${h.history_id}`,
          event_date: h.history_date,
          event_type: 'status_change',
          event_title: 'Status Changed',
          event_description: `${h.status_before} → ${h.status_after}`,
          phase: h.phase || '',
          user_name: h.user_name,
          metadata: h
        });
      }
    });

    // Add review recommendations to timeline
    reviewRecommendations.forEach(rec => {
      timeline.push({
        event_id: `review-${rec.recommendation_id}`,
        event_date: rec.submitted_at,
        event_type: 'review',
        event_title: 'Review Submitted',
        event_description: `${rec.reviewer_name}: ${rec.recommendation}`,
        phase: rec.phase,
        user_name: rec.reviewer_name,
        metadata: rec
      });
    });

    // Add deviations to timeline
    deviations.forEach(dev => {
      timeline.push({
        event_id: `deviation-${dev.deviation_id}`,
        event_date: dev.submitted_at,
        event_type: 'deviation',
        event_title: 'Deviation Reported',
        event_description: `${dev.deviation_type}: ${dev.deviation_description}`,
        phase: 'Phase 6: Data Collection & Reporting',
        metadata: dev
      });
    });

    // Add final reports to timeline
    finalReports.forEach(report => {
      timeline.push({
        event_id: `report-${report.report_id}`,
        event_date: report.submitted_at,
        event_type: 'final_report',
        event_title: 'Final Report Submitted',
        event_description: `Status: ${report.status}`,
        phase: 'Phase 7: Final Report Submission',
        metadata: report
      });
    });

    // Sort timeline by date (most recent first)
    return timeline.sort((a, b) => 
      new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
    );
  }

  /**
   * Helper: Determine if a proposal is completed
   */
  private isProposalCompleted(status: string): boolean {
    return status === 'Archive Files' || status === 'Completed';
  }

  /**
   * Helper: Extract filename from file path
   */
  private extractFileName(filePath: string): string {
    const raw = filePath.split('/').pop() || filePath;
    return raw.trim();
  }

  /**
   * Helper: Derive phase from storage/file path when doc_type is missing or unclear
   */
  private getPhaseFromFilePath(filePath: string): string {
    if (!filePath) return 'Unknown Phase';

    const normalizedPath = filePath.toLowerCase();

    if (normalizedPath.includes('/send manuscript/')) {
      return 'Phase 1: Manuscript Submission';
    }
    if (normalizedPath.includes('/send forms/')) {
      return 'Phase 3: Forms Submission';
    }
    if (normalizedPath.includes('/send revision/')) {
      return 'Phase 4: Deployment Queue';
    }
    if (normalizedPath.includes('final-report') || normalizedPath.includes('final_report') || normalizedPath.includes('/final-reports/')) {
      return 'Phase 7: Final Report Submission';
    }

    return 'Unknown Phase';
  }

  /**
   * Helper: Build virtual path for form_data-backed (fillable) forms
   */
  private buildFormDataVirtualPath(proposalId: number, formName: string): string {
    return `form-data://${proposalId}/${encodeURIComponent(formName)}`;
  }

  /**
   * Helper: Get phase name from document type
   */
  private getPhaseFromDocType(docType: string): string {
    if (!docType) return 'Unknown Phase';
    
    const docTypeLower = docType.toLowerCase();
    const docTypeUpper = docType.toUpperCase();
    
    // Manuscript phase documents
    if (docTypeLower.includes('manuscript')) {
      return 'Phase 1: Manuscript Submission';
    }
    
    // Forms phase documents - Phase 3
    // Exact form names
    const phase3Forms = [
      'REC_FO_0032_EthicsProtocolChecklist.pdf',
      'REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample.pdf',
      'REC_FO_0036_MOA for external.pdf',
      'REC_FO_0027_EthicsApplicationProcedure.pdf',
      'REC_FO_0028_EthicsStudyProtocolInformationForm.pdf',
      'REC_FO_0029_EthicsInformedConsentCHECKLIST.pdf',
      'REC_FO_0030_EthicsInformedConsentFormwhenQuestionnaireareUsed.pdf',
      'REC_FO_0031_EthicsInformedConsentForm(ICF)_Sample.pdf',
      'REC_FO_0034_Ethics-Assent-Form-18-below-respondents_Sample.pdf',
      'REC_ENDORSMENT_FORM.pdf',
      'REC_FO_0035_Ethics Memorandum of Agreement for Authorship.pdf',
      'All Grades',
      'Updated CV',
      'Minutes of Proposal Defense',
      'Defense Receipt',
      'Payment Receipt'
    ];
    
    // Check for exact matches first (case-insensitive)
    if (phase3Forms.some(form => docType.toLowerCase() === form.toLowerCase())) {
      return 'Phase 3: Forms Submission';
    }
    
    // Check for partial matches with REC forms and other Phase 3 documents
    if (docTypeUpper.includes('REC_FO') || 
        docTypeUpper.includes('REC_ENDORSMENT') ||
        docTypeLower.includes('ethics') || 
        docTypeLower.includes('consent') || 
        docTypeLower.includes('data management') ||
        docTypeLower.includes('protocol') ||
        docTypeLower.includes('informed consent') ||
        docTypeLower.includes('participant') ||
        docTypeLower.includes('recruitment') ||
        docTypeLower.includes('survey') ||
        docTypeLower.includes('interview') ||
        docTypeLower.includes('questionnaire') ||
        docTypeLower.includes('all grades') ||
        docTypeLower.includes('updated cv') ||
        docTypeLower.includes('cv') ||
        docTypeLower.includes('grades') ||
        docTypeLower.includes('minutes of proposal defense') ||
        docTypeLower.includes('defense receipt') ||
        docTypeLower.includes('payment receipt') ||
        docTypeLower.includes('moa') ||
        docTypeLower.includes('memorandum of agreement') ||
        docTypeLower.includes('assent') ||
        docTypeLower.includes('application') ||
        docTypeLower.includes('authorship') ||
        docTypeLower.includes('endorsment') ||
        docTypeLower.includes('endorsement') ||
        docTypeLower.includes('pife') || // Protocol Information Form for Exemption
        docTypeLower.includes('checklist')) {
      return 'Phase 3: Forms Submission';
    }
    
    // Revision phase documents
    if (docTypeLower.includes('revision') || docTypeLower.includes('revised')) {
      return 'Phase 4: Deployment Queue';
    }
    
    // Deviation documents
    if (docTypeLower.includes('deviation')) {
      return 'Phase 6: Data Collection & Reporting';
    }
    
    // Final report documents
    if (docTypeLower.includes('final report') || docTypeLower.includes('study report')) {
      return 'Phase 7: Final Report Submission';
    }
    
    // Fallback - try to determine from common keywords
    const typeMap: Record<string, string> = {
      'payment': 'Phase 3: Forms Submission',
      'receipt': 'Phase 3: Forms Submission',
      'letter': 'Phase 3: Forms Submission',
      'assessment': 'Phase 5: Documents Review',
      'recommendation': 'Phase 5: Documents Review',
      'clearance': 'Phase 5: Documents Review'
    };
    
    for (const [key, value] of Object.entries(typeMap)) {
      if (docTypeLower.includes(key)) {
        return value;
      }
    }
    
    return 'Unknown Phase';
  }

  /**
   * Helper: Get phase name from status
   */
  private getPhaseFromStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'Send Manuscript': 'Phase 1: Manuscript Submission',
      'Check Manuscript': 'Phase 1: Manuscript Submission',
      'Resend Manuscript': 'Phase 1: Manuscript Submission',
      'Risk Assessment': 'Phase 2: Risk Assessment',
      'Send Forms': 'Phase 3: Forms Submission',
      'Forms Check': 'Phase 3: Forms Submission',
      'Resend Forms': 'Phase 3: Forms Submission',
      'Deploy Queue': 'Phase 4: Deployment Queue',
      'Send Revision': 'Phase 4: Deployment Queue',
      'Check Revision': 'Phase 4: Deployment Queue',
      'Resend Revision': 'Phase 4: Deployment Queue',
      'Assign Review': 'Phase 5: Documents Review',
      'Proposal Review': 'Phase 5: Documents Review',
      'Revise Proposal': 'Phase 5: Documents Review',
      'Data Collection': 'Phase 6: Data Collection & Reporting',
      'Deviation Check': 'Phase 6: Data Collection & Reporting',
      'Send Deviation Report': 'Phase 6: Data Collection & Reporting',
      'Send Study Report': 'Phase 6: Data Collection & Reporting',
      'Revise Documents': 'Phase 6: Data Collection & Reporting',
      'Study Report Check': 'Phase 6: Data Collection & Reporting',
      'Send Report': 'Phase 7: Final Report Submission',
      'Archive Files': 'Phase 7: Final Report Submission'
    };
    
    return statusMap[status] || 'Unknown Phase';
  }
}

// Export singleton instance
export const researcherHistoryService = new ResearcherHistoryService();
