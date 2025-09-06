

export type FormField = {
  name: string;             // unique key
  label: string;            // user-facing label
  type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: string[];       // for select
  help?: string;            // helper text
  rows?: number;            // textarea sizing
  dependsOn?: string;       // controlling field name
  showIfEquals?: any;       // value to match exactly
  showIfIn?: any[];         // values array includes controlling value
};

import { FileText, AlertTriangle, BarChart3, Edit3, RefreshCcw, StopCircle } from 'lucide-react';

export type FormDefinition = {
  id: string;                
  title: string;             
  description?: string;
  category?: string;        
  fields: FormField[];
  submitLabel?: string;
  icon?: any;                
};


export const protocolFinalReportForm: FormDefinition = {
  id: 'protocol-final-report',
  title: 'Protocol Final Report',
  description: 'Comprehensive summary of the completed research protocol.',
  category: 'Study Closure',
  submitLabel: 'Submit Final Report',
  icon: FileText,
  fields: [
    { name: 'protocol_title', label: 'Protocol / Study Title', type: 'text', required: true, placeholder: 'Enter full protocol title' },
    { name: 'protocol_number', label: 'Protocol / REC Reference Number', type: 'text', required: true },
    { name: 'principal_investigator', label: 'Principal Investigator (PI)', type: 'text', required: true },
    { name: 'pi_email', label: 'PI Email', type: 'text', required: true },
    { name: 'sponsor_name', label: 'Sponsor / Funding Agency', type: 'text', required: false },
    { name: 'study_site', label: 'Study Site(s)', type: 'textarea', rows: 2, placeholder: 'List sites', required: false },
    { name: 'date_first_enrollment', label: 'Date of First Enrollment', type: 'date', required: false },
    { name: 'date_last_enrollment', label: 'Date of Last Enrollment', type: 'date', required: false },
    { name: 'date_study_completion', label: 'Date Study Completed', type: 'date', required: true },
    { name: 'registered_clinical_trial', label: 'Registered Clinical Trial ID', type: 'text', placeholder: 'e.g., ClinicalTrials.gov ID', required: false },

    { name: 'study_objectives', label: 'Primary & Secondary Objectives', type: 'textarea', rows: 4, required: true },
    { name: 'study_design', label: 'Study Design Summary', type: 'textarea', rows: 3, required: true },
    { name: 'population_description', label: 'Population Description', type: 'textarea', rows: 3, required: true },

    { name: 'target_sample_size', label: 'Target Sample Size', type: 'number', required: true },
    { name: 'actual_enrolled', label: 'Actual Number Enrolled', type: 'number', required: true },
    { name: 'completed_participants', label: 'Number Completed Study', type: 'number', required: false },
    { name: 'withdrawn_participants', label: 'Number Withdrawn / Lost to Follow-up', type: 'number', required: false },
    { name: 'reasons_withdrawal', label: 'Reasons for Withdrawal', type: 'textarea', rows: 3 },

    { name: 'protocol_amendments', label: 'Summary of Protocol Amendments', type: 'textarea', rows: 4 },
    { name: 'serious_adverse_events', label: 'Serious Adverse Events (Summary)', type: 'textarea', rows: 4 },
    { name: 'adverse_events', label: 'Other Adverse Events (Summary)', type: 'textarea', rows: 4 },
    { name: 'unanticipated_problems', label: 'Unanticipated Problems / Deviations', type: 'textarea', rows: 4 },
    { name: 'study_limitations', label: 'Study Limitations', type: 'textarea', rows: 3 },

    { name: 'primary_outcomes', label: 'Primary Outcomes (Results)', type: 'textarea', rows: 5, required: true },
    { name: 'secondary_outcomes', label: 'Secondary Outcomes (Results)', type: 'textarea', rows: 5 },
    { name: 'statistical_analysis_summary', label: 'Statistical Analysis Summary', type: 'textarea', rows: 4 },
    { name: 'conclusions', label: 'Conclusions / Interpretation', type: 'textarea', rows: 4, required: true },
    { name: 'dissemination_plan', label: 'Publication / Dissemination Plan', type: 'textarea', rows: 3 },

    { name: 'data_storage_location', label: 'Data Storage / Archival Location', type: 'textarea', rows: 2 },
    { name: 'documents_submitted', label: 'Documents Submitted (Attach if required)', type: 'textarea', rows: 2, help: 'List documents like final dataset, statistical report, participant list (anonymized), etc.' },

    { name: 'pi_signature_name', label: 'PI Name (Signature)', type: 'text', required: true },
    { name: 'pi_signature_date', label: 'Signature Date', type: 'date', required: true },
  ]
};

// Assumed structure for REC_FO_0021_RNE (Report of New Event) form. Adjust field labels/order as needed.
export const reportNewEventForm: FormDefinition = {
  id: 'rec-fo-0021-rne',
  title: 'Report of New Event (RNE)',
  description: 'Report unexpected events: adverse events, deviations, early termination, safety info.',
  category: 'Safety Reporting',
  submitLabel: 'Submit Event Report',
  icon: AlertTriangle,
  fields: [
    { name: 'protocol_title', label: 'Protocol Title', type: 'text', required: true },
    { name: 'rec_reference_number', label: 'REC Reference Number', type: 'text', required: true },
    { name: 'site', label: 'Study Site', type: 'text', required: true },
    { name: 'event_type', label: 'Event Type', type: 'select', required: true, options: [
      'Serious Adverse Event',
      'Adverse Event',
      'Protocol Deviation',
      'Unanticipated Problem',
      'Early Study Termination',
      'Safety Information Update',
      'Other'
    ] },
  { name: 'other_event_type', label: 'If Other, Specify', type: 'text', placeholder: 'Specify event type', required: false, dependsOn: 'event_type', showIfEquals: 'Other' },
    { name: 'date_of_event', label: 'Date of Event', type: 'date', required: true },
    { name: 'date_reported_to_rec', label: 'Date Reported to REC', type: 'date', required: true },
    { name: 'subject_id', label: 'Subject / Participant ID (if applicable)', type: 'text', required: false },
    { name: 'age', label: 'Age (if subject specific)', type: 'number', required: false },
    { name: 'gender', label: 'Gender (if subject specific)', type: 'select', options: ['Male','Female','Other','Prefer not to say'], required: false },
    { name: 'event_description', label: 'Detailed Description of Event', type: 'textarea', rows: 5, required: true },
    { name: 'immediate_actions', label: 'Immediate Actions Taken', type: 'textarea', rows: 4, required: true },
    { name: 'medical_management', label: 'Medical Management / Treatment Provided', type: 'textarea', rows: 4 },
    { name: 'relatedness_assessment', label: 'Assessment of Relatedness to Study Intervention', type: 'textarea', rows: 3, help: 'Describe investigator assessment (e.g., Not related, Possibly related, Definitely related).' },
    { name: 'risk_assessment', label: 'Assessment of Risk / Impact on Participants', type: 'textarea', rows: 4 },
    { name: 'corrective_actions', label: 'Proposed Corrective / Preventive Actions (CAPA)', type: 'textarea', rows: 4, required: true },
    { name: 'need_for_amendment', label: 'Need for Protocol / ICF Amendment? (Yes/No + Rationale)', type: 'textarea', rows: 3 },
    { name: 'regulatory_notified', label: 'Regulatory Authorities Notified (Names / Dates)', type: 'textarea', rows: 3 },
    { name: 'other_sites_affected', label: 'Other Sites Affected / Notified', type: 'textarea', rows: 3 },
    { name: 'documents_attached', label: 'Documents Attached', type: 'textarea', rows: 2, help: 'List: medical reports, lab results, narrative, DSMB notice, etc.' },
    { name: 'reporting_person', label: 'Reporting Person (Name & Role)', type: 'text', required: true },
    { name: 'reporting_person_email', label: 'Reporting Person Email', type: 'text', required: true },
    { name: 'pi_confirmation', label: 'PI Confirmation / Remarks', type: 'textarea', rows: 3 },
    { name: 'pi_signature_name', label: 'PI Name (Signature)', type: 'text', required: true },
    { name: 'pi_signature_date', label: 'Signature Date', type: 'date', required: true }
  ]
};

// REC_FO_0019 Progress Report form definition (Progress updates during ongoing study)
export const progressReportForm: FormDefinition = {
  id: 'progress-report',
  title: 'Progress Report',
  description: 'Interim progress update on ongoing approved protocol.',
  category: 'Ongoing Study Reports',
  submitLabel: 'Submit Progress Report',
  icon: BarChart3,
  fields: [
    { name: 'protocol_title', label: 'Protocol Title', type: 'text', required: true },
    { name: 'rec_reference_number', label: 'REC Reference Number', type: 'text', required: true },
    { name: 'principal_investigator', label: 'Principal Investigator', type: 'text', required: true },
    { name: 'reporting_period_start', label: 'Reporting Period Start Date', type: 'date', required: true },
    { name: 'reporting_period_end', label: 'Reporting Period End Date', type: 'date', required: true },
    { name: 'date_submitted', label: 'Date Submitted', type: 'date', required: true },
    { name: 'overall_progress_summary', label: 'Overall Progress Summary', type: 'textarea', rows: 5, required: true },
    { name: 'enrollment_target', label: 'Target Enrollment (Cumulative)', type: 'number', required: true },
    { name: 'enrollment_actual', label: 'Actual Enrollment to Date', type: 'number', required: true },
    { name: 'reasons_enrollment_variance', label: 'Reasons for Enrollment Variance', type: 'textarea', rows: 3 },
    { name: 'withdrawals_count', label: 'Participant Withdrawals (Count)', type: 'number' },
    { name: 'withdrawals_reasons', label: 'Reasons for Withdrawal', type: 'textarea', rows: 3 },
    { name: 'protocol_deviations', label: 'Protocol Deviations During Period', type: 'textarea', rows: 4 },
    { name: 'serious_adverse_events', label: 'Serious Adverse Events Since Last Report', type: 'textarea', rows: 4 },
    { name: 'other_adverse_events', label: 'Other Adverse Events', type: 'textarea', rows: 3 },
    { name: 'amendments_submitted', label: 'Amendments Submitted/Approved', type: 'textarea', rows: 3 },
    { name: 'interim_findings', label: 'Interim Findings / Preliminary Results', type: 'textarea', rows: 4 },
    { name: 'data_safety_monitoring', label: 'Data / Safety Monitoring Activities', type: 'textarea', rows: 3 },
    { name: 'challenges', label: 'Challenges / Obstacles', type: 'textarea', rows: 3 },
    { name: 'mitigation_actions', label: 'Mitigation / Corrective Actions', type: 'textarea', rows: 3 },
    { name: 'anticipated_changes', label: 'Anticipated Changes Before Next Report', type: 'textarea', rows: 3 },
    { name: 'continuing_need_justification', label: 'Justification for Continuing the Study', type: 'textarea', rows: 4, required: true },
    { name: 'pi_signature_name', label: 'PI Name (Signature)', type: 'text', required: true },
    { name: 'pi_signature_date', label: 'Signature Date', type: 'date', required: true }
  ]
};

// REC_FO_0018 Protocol Amendment Form
export const protocolAmendmentForm: FormDefinition = {
  id: 'protocol-amendment',
  title: 'Protocol Amendment',
  description: 'Submission of proposed changes to an approved protocol.',
  category: 'Amendments',
  submitLabel: 'Submit Amendment',
  icon: Edit3,
  fields: [
    { name: 'protocol_title', label: 'Protocol Title', type: 'text', required: true },
    { name: 'rec_reference_number', label: 'REC Reference Number', type: 'text', required: true },
    { name: 'principal_investigator', label: 'Principal Investigator', type: 'text', required: true },
    { name: 'amendment_number', label: 'Amendment Number / Identifier', type: 'text', required: true },
    { name: 'date_submitted', label: 'Date Submitted', type: 'date', required: true },
    { name: 'reason_for_amendment', label: 'Reason for Amendment', type: 'textarea', rows: 4, required: true },
    { name: 'summary_of_changes', label: 'Summary of Proposed Changes', type: 'textarea', rows: 6, required: true },
    { name: 'affected_sections', label: 'Affected Sections / Documents', type: 'textarea', rows: 4, help: 'List protocol sections, ICF, CRFs, recruitment materials, etc.' },
    { name: 'impact_assessment', label: 'Impact on Study Design / Participants', type: 'textarea', rows: 5, required: true },
    { name: 'changes_to_risk', label: 'Changes to Risk-Benefit Assessment', type: 'textarea', rows: 4 },
    { name: 'changes_to_informed_consent', label: 'Changes to Informed Consent Process', type: 'textarea', rows: 4 },
    { name: 'changes_to_sample_size', label: 'Changes to Sample Size / Statistical Plan', type: 'textarea', rows: 4 },
    { name: 'ongoing_participants_management', label: 'Management of Already Enrolled Participants', type: 'textarea', rows: 4 },
    { name: 'supporting_documents', label: 'Supporting Documents List', type: 'textarea', rows: 3, help: 'List tracked-change protocol, clean copy, revised ICF, recruitment materials, etc.' },
    { name: 'urgent_implementation', label: 'Implemented Prior to Approval? (If Yes, Justification)', type: 'textarea', rows: 3 },
    { name: 'capa_if_applicable', label: 'CAPA Related (If deviation-triggered)', type: 'textarea', rows: 3 },
    { name: 'pi_signature_name', label: 'PI Name (Signature)', type: 'text', required: true },
    { name: 'pi_signature_date', label: 'Signature Date', type: 'date', required: true }
  ]
};

// REC_FO_0023 Ethics Continuing Review Application Form
export const continuingReviewForm: FormDefinition = {
  id: 'continuing-review',
  title: 'Continuing Review Application',
  description: 'Periodic ethics continuing review submission for an approved ongoing study.',
  category: 'Continuing Review',
  submitLabel: 'Submit Continuing Review',
  icon: RefreshCcw,
  fields: [
    { name: 'protocol_title', label: 'Protocol Title', type: 'text', required: true },
    { name: 'rec_reference_number', label: 'REC Reference Number', type: 'text', required: true },
    { name: 'principal_investigator', label: 'Principal Investigator', type: 'text', required: true },
    { name: 'date_initial_approval', label: 'Initial REC Approval Date', type: 'date', required: true },
    { name: 'current_approval_expiry', label: 'Current Approval Expiry Date', type: 'date', required: true },
    { name: 'period_start', label: 'Reporting Period Start', type: 'date', required: true },
    { name: 'period_end', label: 'Reporting Period End', type: 'date', required: true },
    { name: 'enrollment_target_to_date', label: 'Target Enrollment to Date', type: 'number', required: true },
    { name: 'enrollment_actual_to_date', label: 'Actual Enrollment to Date', type: 'number', required: true },
    { name: 'enrollment_explanation', label: 'Explanation for Enrollment Variance', type: 'textarea', rows: 3 },
    { name: 'participants_completed', label: 'Participants Completed', type: 'number' },
    { name: 'participants_withdrawn', label: 'Participants Withdrawn', type: 'number' },
    { name: 'withdrawal_reasons', label: 'Reasons for Withdrawal', type: 'textarea', rows: 3 },
    { name: 'summary_progress', label: 'Summary of Study Progress Since Last Approval', type: 'textarea', rows: 5, required: true },
    { name: 'amendments_since_last', label: 'Amendments Since Last Approval (List / Dates)', type: 'textarea', rows: 4 },
    { name: 'protocol_deviations_since_last', label: 'Protocol Deviations Since Last Approval', type: 'textarea', rows: 4 },
    { name: 'serious_adverse_events_since_last', label: 'Serious Adverse Events Since Last Approval', type: 'textarea', rows: 4 },
    { name: 'other_adverse_events_since_last', label: 'Other Adverse Events Since Last Approval', type: 'textarea', rows: 3 },
    { name: 'unanticipated_problems', label: 'Unanticipated Problems / New Information', type: 'textarea', rows: 4 },
    { name: 'new_risks', label: 'New Risks or Risk Changes Identified', type: 'textarea', rows: 3 },
    { name: 'confidentiality_issues', label: 'Confidentiality / Data Security Issues', type: 'textarea', rows: 3 },
    { name: 'monitoring_summary', label: 'Monitoring / DSMB Reports Summary', type: 'textarea', rows: 4 },
    { name: 'publications_or_presentations', label: 'Publications / Presentations to Date', type: 'textarea', rows: 3 },
    { name: 'materials_to_renew', label: 'Materials Submitted for Renewal', type: 'textarea', rows: 3, help: 'List updated protocol, ICF, recruitment materials, investigator brochure, safety reports, etc.' },
    { name: 'continuing_need_justification', label: 'Justification for Continuing the Study', type: 'textarea', rows: 5, required: true },
    { name: 'anticipated_completion_date', label: 'Anticipated Study Completion Date', type: 'date' },
    { name: 'pi_signature_name', label: 'PI Name (Signature)', type: 'text', required: true },
    { name: 'pi_signature_date', label: 'Signature Date', type: 'date', required: true }
  ]
};

// REC_FO_0022 Ethics Early Study Termination Application Form
export const earlyTerminationForm: FormDefinition = {
  id: 'early-study-termination',
  title: 'Early Study Termination',
  description: 'Application for early termination of an approved study prior to planned completion.',
  category: 'Study Closure',
  submitLabel: 'Submit Termination Application',
  icon: StopCircle,
  fields: [
    { name: 'protocol_title', label: 'Protocol Title', type: 'text', required: true },
    { name: 'rec_reference_number', label: 'REC Reference Number', type: 'text', required: true },
    { name: 'principal_investigator', label: 'Principal Investigator', type: 'text', required: true },
    { name: 'termination_request_date', label: 'Date of Termination Request', type: 'date', required: true },
    { name: 'original_anticipated_completion', label: 'Original Anticipated Completion Date', type: 'date' },
    { name: 'date_last_participant_activity', label: 'Date of Last Participant Activity', type: 'date' },
    { name: 'enrolled_participants_total', label: 'Total Participants Enrolled', type: 'number', required: true },
    { name: 'participants_completed', label: 'Participants Completed Study', type: 'number' },
    { name: 'participants_in_followup', label: 'Participants in Follow-up', type: 'number' },
    { name: 'participants_withdrawn', label: 'Participants Withdrawn / Lost', type: 'number' },
    { name: 'reason_for_termination', label: 'Primary Reason for Early Termination', type: 'select', required: true, options: [
      'Safety Concerns', 'Lack of Efficacy', 'Regulatory Directive', 'Funding / Resource Constraints', 'Poor Enrollment', 'Protocol Feasibility Issues', 'Sponsor Decision', 'Other'
    ] },
  { name: 'other_reason_detail', label: 'If Other, Specify', type: 'text', dependsOn: 'reason_for_termination', showIfEquals: 'Other' },
    { name: 'detailed_rationale', label: 'Detailed Rationale / Background', type: 'textarea', rows: 5, required: true },
    { name: 'safety_findings_summary', label: 'Summary of Any Safety Findings', type: 'textarea', rows: 4 },
    { name: 'efficacy_findings_summary', label: 'Summary of Any Efficacy / Outcome Findings', type: 'textarea', rows: 4 },
    { name: 'data_collected_status', label: 'Status of Data Collected / Integrity', type: 'textarea', rows: 4 },
    { name: 'disposition_of_participants', label: 'Disposition / Management of Current Participants', type: 'textarea', rows: 4, required: true },
    { name: 'followup_plan', label: 'Plan for Participant Follow-up / Safety Monitoring', type: 'textarea', rows: 4 },
    { name: 'study_materials_storage', label: 'Storage / Archiving of Study Materials & Data', type: 'textarea', rows: 3 },
    { name: 'investigational_products_accountability', label: 'Investigational Products Accountability / Disposal', type: 'textarea', rows: 3 },
    { name: 'notifications_done', label: 'Notifications (Sponsor, Regulatory, DSMB, etc.)', type: 'textarea', rows: 3 },
    { name: 'publications_plan', label: 'Publication / Dissemination Plan (If Applicable)', type: 'textarea', rows: 3 },
    { name: 'documents_submitted', label: 'Documents Submitted With Application', type: 'textarea', rows: 3, help: 'List: final data listings, safety reports, inventory logs, communication letters, etc.' },
    { name: 'pi_signature_name', label: 'PI Name (Signature)', type: 'text', required: true },
    { name: 'pi_signature_date', label: 'Signature Date', type: 'date', required: true }
  ]
};

// Local submission count helpers (using localStorage)
const FORM_COUNTS_KEY = 'form_submission_counts';
export type FormSubmissionCounts = Record<string, number>;

export function getFormSubmissionCounts(): FormSubmissionCounts {
  try {
    return JSON.parse(localStorage.getItem(FORM_COUNTS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function incrementFormSubmissionCount(id: string) {
  const counts = getFormSubmissionCounts();
  counts[id] = (counts[id] || 0) + 1;
  try { localStorage.setItem(FORM_COUNTS_KEY, JSON.stringify(counts)); } catch { }
  return counts[id];
}

export const formsCatalog: FormDefinition[] = [
  protocolFinalReportForm,
  reportNewEventForm,
  progressReportForm,
  protocolAmendmentForm,
  continuingReviewForm,
  earlyTerminationForm,
  // Add additional form definitions here.
];

export const formCategories = Array.from(
  formsCatalog.reduce((acc, f) => acc.add(f.category || 'General'), new Set<string>())
);
