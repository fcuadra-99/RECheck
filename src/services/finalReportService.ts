import { supabase } from '../DB';
import type { FinalReportFilter, UpdateFinalReportPayload } from '../types/finalReport';

const TABLE = 'final_reports';
const ASSIGN_TABLE = 'final_report_assignments';

export interface AssignableStaffProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface StaffCandidate {
  id: string;
  name: string;
  email: string;
  role?: string;
  source: 'users' | 'profiles';
}

export interface FinalReportAssignment {
  id?: string;
  final_report_id: string;
  assignee_id: string;
  assignee_name: string;
  assignee_role?: string;
  assigned_by_id: string;
  assigned_by_name: string;
  assigned_at: string;
  status: 'assigned' | 'submitted';
  submitted_file_path?: string | null;
  submitted_file_name?: string | null;
  submitted_comments?: string | null;
  submitted_at?: string | null;
}

const normalizeRoleLabel = (value?: string | null) => (value || '').trim().toLowerCase().replace(/[_\-]+/g, ' ');

const toDisplayRole = (value?: string | null) => {
  const normalized = normalizeRoleLabel(value);
  if (normalized.includes('admin assistant')) return 'Admin Assistant';
  if (normalized.includes('reviewer')) return 'Reviewer';
  return value || '';
};

const toStableRoleKey = (value?: string | null) => normalizeRoleLabel(value).replace(/\s+/g, '');

const isAssignableRole = (value?: string | null) => {
  const normalized = normalizeRoleLabel(value);
  const stable = toStableRoleKey(value);
  if (!normalized && !stable) return false;
  return (
    normalized.includes('reviewer') ||
    normalized.includes('admin assistant') ||
    stable.includes('adminassistant') ||
    stable.includes('reviewer')
  );
};

const normalizeEmail = (value?: string | null) => (value || '').trim().toLowerCase();

const pickPreferredCandidate = (current: StaffCandidate | undefined, incoming: StaffCandidate) => {
  if (!current) return incoming;

  // Prefer profile identities when available since they are typically auth-linked IDs.
  if (current.source !== 'profiles' && incoming.source === 'profiles') return incoming;

  // Prefer records with richer display data.
  const currentNameQuality = current.name && current.name !== 'Staff';
  const incomingNameQuality = incoming.name && incoming.name !== 'Staff';
  if (!currentNameQuality && incomingNameQuality) return incoming;

  return current;
};

export async function listFinalReports(filter: FinalReportFilter = {}) {
  let query = supabase.from(TABLE).select('*').order('submitted_at', { ascending: false });
  if (filter.status && filter.status !== 'All') {
    query = query.eq('status', filter.status);
  }
  if (filter.search && filter.search.trim()) {
    // Basic ILIKE on title or stored researcher name (assuming a materialized column researcher_name)
    const term = `%${filter.search.trim()}%`;
    query = query.or(`title.ilike.${term},researcher_name.ilike.${term}`);
  }
  const { data, error } = await query;
  return { data, error };
}

export async function getFinalReport(id: string) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  return { data, error };
}

export async function updateFinalReport(payload: UpdateFinalReportPayload) {
  const { id, ...rest } = payload;
  const { data, error } = await supabase.from(TABLE).update({ ...rest, last_updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return { data, error };
}

export async function createFinalReportDraft(input: { proposal_date: string; title: string; attachments?: string[] }) {
  const { data: auth } = await supabase.auth.getUser();
  const researcherId = auth?.user?.id;
  const insertPayload: any = {
    proposal_date: input.proposal_date,
    title: input.title,
    attachments: input.attachments || [],
    researcher_id: researcherId,
    status: 'Pending Review',
    submitted_at: new Date().toISOString(),
    last_updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from(TABLE).insert([insertPayload]).select().single();
  return { data, error };
}

export async function getAssignableFinalReportStaff() {
  try {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, name, email, role');

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, fname, lname, email, role, category');

    const identityMap = new Map<string, StaffCandidate>();
    const profileCount = (profilesData || []).filter((row: any) => isAssignableRole(row.role) || isAssignableRole(row.category)).length;

    (usersData || []).forEach((row: any) => {
      if (!isAssignableRole(row.role)) return;
      const email = normalizeEmail(row.email);
      const key = email || String(row.id);
      // If assignable profiles exist, avoid introducing users-only identities that can drift from auth IDs.
      if (profileCount > 0 && !email) return;
      const candidate: StaffCandidate = {
        id: row.id,
        name: row.name || row.email || 'Staff',
        email: row.email || '',
        role: toDisplayRole(row.role),
        source: 'users'
      };
      identityMap.set(key, pickPreferredCandidate(identityMap.get(key), candidate));
    });

    (profilesData || []).forEach((row: any) => {
      if (!isAssignableRole(row.role) && !isAssignableRole(row.category)) return;
      const fullName = `${row.fname || ''} ${row.lname || ''}`.trim();
      const email = normalizeEmail(row.email);
      const key = email || String(row.id);
      const existing = identityMap.get(key);
      const candidate: StaffCandidate = {
        id: row.id,
        name: fullName || existing?.name || row.email || 'Staff',
        email: row.email || existing?.email || '',
        role: toDisplayRole(row.role || row.category || existing?.role),
        source: 'profiles'
      };
      identityMap.set(key, pickPreferredCandidate(existing, candidate));
    });

    const staff = Array.from(identityMap.values())
      .map((item) => ({ id: item.id, name: item.name, email: item.email, role: item.role }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { success: true as const, staff };
  } catch (error: any) {
    console.error('Failed to load assignable staff:', error);
    return { success: false as const, error: error?.message || 'Failed to load staff' };
  }
}

export async function assignFinalReportToStaff(reportId: string, staffIds: string[]) {
  try {
    const uniqueIds = Array.from(new Set(staffIds.filter(Boolean)));
    if (uniqueIds.length < 1 || uniqueIds.length > 4) {
      return { success: false as const, error: 'Please assign 1 to 4 staff members' };
    }

    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData.user?.id;
    if (!currentUserId) {
      return { success: false as const, error: 'User not authenticated' };
    }

    const { data: chairProfile } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', currentUserId)
      .single();

    const now = new Date().toISOString();
    const assignerName = chairProfile?.name || chairProfile?.email || authData.user?.email || 'Chairperson';

    const staffPoolResult = await getAssignableFinalReportStaff();
    if (!staffPoolResult.success) {
      return { success: false as const, error: staffPoolResult.error || 'Failed to load assignable staff' };
    }

    const staffMap = new Map((staffPoolResult.staff || []).map((s) => [s.id, s]));
    const validIds = uniqueIds.filter((id) => staffMap.has(id));

    if (validIds.length < 1 || validIds.length > 4) {
      return {
        success: false as const,
        error: 'Selected staff are no longer valid. Please reselect from the current assignable list.'
      };
    }

    const rows: FinalReportAssignment[] = validIds.map((assigneeId) => {
      const staff = staffMap.get(assigneeId);
      return {
        final_report_id: reportId,
        assignee_id: assigneeId,
        assignee_name: staff?.name || 'Assigned Staff',
        assignee_role: staff?.role || null || undefined,
        assigned_by_id: currentUserId,
        assigned_by_name: assignerName,
        assigned_at: now,
        status: 'assigned',
        submitted_file_path: null,
        submitted_file_name: null,
        submitted_comments: null,
        submitted_at: null,
      };
    });

    const { error: deleteError } = await supabase
      .from(ASSIGN_TABLE)
      .delete()
      .eq('final_report_id', reportId);

    if (deleteError) {
      return { success: false as const, error: deleteError.message };
    }

    const { error: insertError } = await supabase
      .from(ASSIGN_TABLE)
      .insert(rows);

    if (insertError) {
      return { success: false as const, error: insertError.message };
    }

    const { error: updateError } = await supabase
      .from(TABLE)
      .update({
        status: 'Under Review',
        reviewer_id: validIds[0] || null,
        last_updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (updateError) {
      return { success: false as const, error: updateError.message };
    }

    return { success: true as const };
  } catch (error: any) {
    console.error('Failed to assign final report staff:', error);
    return { success: false as const, error: error?.message || 'Failed to assign staff' };
  }
}

export async function getAssignedFinalReportsForCurrentStaff() {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData.user?.id;
    const currentUserEmail = normalizeEmail(authData.user?.email);
    if (!currentUserId) {
      return { success: false as const, error: 'User not authenticated' };
    }

    const aliasIds = new Set<string>([currentUserId]);

    if (currentUserEmail) {
      const { data: profileAliases } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', currentUserEmail);

      (profileAliases || []).forEach((row: any) => {
        if (row?.id) aliasIds.add(row.id);
      });

      const { data: userAliases } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', currentUserEmail);

      (userAliases || []).forEach((row: any) => {
        if (row?.id) aliasIds.add(row.id);
      });
    }

    const aliasIdList = Array.from(aliasIds);

    const { data: joinedRows, error: joinedError } = await supabase
      .from(ASSIGN_TABLE)
      .select('*, final_report:final_reports(*)')
      .in('assignee_id', aliasIdList)
      .order('assigned_at', { ascending: false });

    if (!joinedError && joinedRows) {
      const reports = (joinedRows as any[])
        .map((row) => row.final_report)
        .filter(Boolean);

      return { success: true as const, reports, assignments: joinedRows as FinalReportAssignment[] };
    }

    const { data: assignments, error: assignmentError } = await supabase
      .from(ASSIGN_TABLE)
      .select('*')
      .in('assignee_id', aliasIdList)
      .order('assigned_at', { ascending: false });

    if (assignmentError) {
      return { success: false as const, error: assignmentError.message };
    }

    const reportIds = (assignments || []).map((assignment: any) => assignment.final_report_id).filter(Boolean);
    if (reportIds.length === 0) {
      return { success: true as const, reports: [], assignments: [] };
    }

    const { data: reports, error } = await supabase
      .from(TABLE)
      .select('*')
      .in('id', reportIds)
      .order('last_updated_at', { ascending: false });

    if (error) {
      return { success: false as const, error: error.message };
    }

    return { success: true as const, reports: reports || [], assignments: assignments || [] };
  } catch (error: any) {
    console.error('Failed to fetch assigned final reports:', error);
    return { success: false as const, error: error?.message || 'Failed to fetch assigned reports' };
  }
}

export async function getFinalReportAssignments(reportId: string) {
  try {
    const { data, error } = await supabase
      .from(ASSIGN_TABLE)
      .select('*')
      .eq('final_report_id', reportId)
      .order('assigned_at', { ascending: false });

    if (error) {
      return { success: false as const, error: error.message };
    }

    return { success: true as const, assignments: (data || []) as FinalReportAssignment[] };
  } catch (error: any) {
    console.error('Failed to load final report assignments:', error);
    return { success: false as const, error: error?.message || 'Failed to load assignments' };
  }
}

export async function submitAssignedFinalReportUpdate(
  reportId: string,
  file: File,
  comments?: string,
  overwritePath?: string,
  mergedFormData?: Record<string, any>
) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData.user?.id;
    if (!currentUserId) {
      return { success: false as const, error: 'User not authenticated' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('fname, lname, role, category')
      .eq('id', currentUserId)
      .single();

    const fullName = `${profile?.fname || ''} ${profile?.lname || ''}`.trim();
    const role = toDisplayRole(profile?.role || profile?.category);

    const { data: report, error: reportError } = await supabase
      .from(TABLE)
      .select('attachments')
      .eq('id', reportId)
      .single();

    if (reportError) {
      return { success: false as const, error: reportError.message };
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from(ASSIGN_TABLE)
      .select('*')
      .eq('final_report_id', reportId)
      .eq('assignee_id', currentUserId)
      .single();

    if (assignmentError || !assignment) {
      return { success: false as const, error: 'You are not assigned to this report' };
    }

    const path = overwritePath || `final-reports/assigned-updates/${reportId}/${currentUserId}_${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('storage').upload(path, file, { upsert: true });
    if (uploadError) {
      return { success: false as const, error: uploadError.message };
    }

    const currentAttachments = Array.isArray(report?.attachments) ? report.attachments : [];
    const nextAttachments = currentAttachments.includes(path)
      ? currentAttachments
      : [...currentAttachments, path];

    const currentMetadata: Record<string, any> = {};
    const currentStaffSubmissions: Record<string, any> = {};

    const submittedAt = new Date().toISOString();

    const { error: assignmentUpdateError } = await supabase
      .from(ASSIGN_TABLE)
      .update({
        assignee_name: fullName || assignment.assignee_name || authData.user?.email || 'Assigned Staff',
        assignee_role: role || assignment.assignee_role || null,
        status: 'submitted',
        submitted_file_path: path,
        submitted_file_name: file.name,
        submitted_comments: comments || null,
        submitted_at: submittedAt,
      })
      .eq('id', assignment.id);

    if (assignmentUpdateError) {
      return { success: false as const, error: assignmentUpdateError.message };
    }

    const nextMetadata: Record<string, any> = {
      ...currentMetadata,
      sharedFormPath: path,
      staffSubmissions: {
        ...currentStaffSubmissions,
        [currentUserId]: {
          staffId: currentUserId,
          staffName: fullName || assignment.assignee_name || authData.user?.email || 'Assigned Staff',
          role: role || assignment.assignee_role || null,
          filePath: path,
          fileName: file.name,
          comments: comments || null,
          submittedAt,
        },
      },
    };

    if (mergedFormData && typeof mergedFormData === 'object') {
      nextMetadata.staffSharedFormData = mergedFormData;
    }

    const baseUpdatePayload: Record<string, any> = {
      attachments: nextAttachments,
      status: 'Under Review',
      last_updated_at: new Date().toISOString()
    };

    let updateError: any = null;

    // Prefer persisting shared-form state in metadata when column exists.
    const { error: updateWithMetadataError } = await supabase
      .from(TABLE)
      .update({
        ...baseUpdatePayload,
        metadata: nextMetadata,
      })
      .eq('id', reportId);

    if (updateWithMetadataError) {
      const message = (updateWithMetadataError.message || '').toLowerCase();
      const metadataColumnMissing = message.includes('metadata') && message.includes('does not exist');

      if (metadataColumnMissing) {
        const { error: fallbackUpdateError } = await supabase
          .from(TABLE)
          .update(baseUpdatePayload)
          .eq('id', reportId);

        updateError = fallbackUpdateError;
      } else {
        updateError = updateWithMetadataError;
      }
    }

    if (updateError) {
      return { success: false as const, error: updateError.message };
    }

    return { success: true as const, path };
  } catch (error: any) {
    console.error('Failed to submit assigned final report update:', error);
    return { success: false as const, error: error?.message || 'Failed to submit update' };
  }
}
