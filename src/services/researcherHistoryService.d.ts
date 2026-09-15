import type { ProposalSummary, ComprehensiveResearcherHistory, ResearcherHistoryFilters } from '../types/researcherHistory';
/**
 * Service for fetching comprehensive researcher history data
 */
export declare class ResearcherHistoryService {
    /**
     * Get all proposals with researcher information
     */
    getAllProposals(filters?: ResearcherHistoryFilters): Promise<ProposalSummary[]>;
    /**
     * Get comprehensive history for a specific proposal/researcher
     */
    getComprehensiveHistory(proposalId: number): Promise<ComprehensiveResearcherHistory | null>;
    /**
     * Get all files uploaded for a proposal across all phases
     */
    private getProposalFiles;
    /**
     * Fetch files directly from storage buckets
     */
    private fetchFilesFromStorage;
    /**
     * Get all history records for a proposal
     */
    private getProposalHistory;
    /**
     * Get all comments from history
     */
    private getProposalComments;
    /**
     * Get deviations for a proposal
     */
    private getProposalDeviations;
    /**
     * Get final reports for a proposal
     */
    private getProposalFinalReports;
    /**
     * Get review recommendations
     */
    private getReviewRecommendations;
    /**
     * Group data by research phases
     */
    private groupDataByPhases;
    /**
     * Create a timeline of all events
     */
    private createTimeline;
    /**
     * Helper: Determine if a proposal is completed
     */
    private isProposalCompleted;
    /**
     * Helper: Extract filename from file path
     */
    private extractFileName;
    /**
     * Helper: Derive phase from storage/file path when doc_type is missing or unclear
     */
    private getPhaseFromFilePath;
    /**
     * Helper: Build virtual path for form_data-backed (fillable) forms
     */
    private buildFormDataVirtualPath;
    /**
     * Helper: Get phase name from document type
     */
    private getPhaseFromDocType;
    /**
     * Helper: Get phase name from status
     */
    private getPhaseFromStatus;
}
export declare const researcherHistoryService: ResearcherHistoryService;
