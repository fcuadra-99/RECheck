

import { supabase } from '../lib/supabase';


export async function getAssignedReviews(reviewerId: string) {
  try {
    const { data, error } = await supabase
      .from('assigned_reviews')
      .select(`
        id,
        status,
        assigned_at,
        due_date,
        proposal:proposals(title),
        reviewer:users(full_name)
      `)
      .eq('reviewer_id', reviewerId);

    if (error) throw error;

    return (data || []).map((r: any) => ({
      title: r.proposal?.title || 'Untitled Proposal',
      dateAssigned: r.assigned_at,
      dueDate: r.due_date,
      researcher: r.reviewer?.full_name || 'Unknown',
      status: r.status || 'pending',
    }));
  } catch (err) {
    console.error('Error fetching assigned reviews', err);
    return [];
  }
}
export async function getReviewById(id: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*,proposal:proposals(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data || null;
}

export async function submitReview(reviewId: string, payload: any) {
  const { data, error } = await supabase
    .from('reviews')
    .update(payload)
    .eq('id', reviewId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// New helpers for dashboard
export type ReviewerStat = { label: string; value: number };
export type Activity = { id: string; title: string; type?: string; date?: string };
export type DeadlineItem = { id: string; title: string; due?: string; dueDate?: string };

export async function getReviewerStats(): Promise<ReviewerStat[]> {
  try {
    // Total assigned
    const { count: totalAssignedCount } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true });

    const { count: completedCount } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Completed');

    const today = new Date().toISOString().slice(0, 10);
    const { count: overdueCount } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .lt('due_date', today)
      .neq('status', 'Completed');

    return [
      { label: 'Assigned', value: Number(totalAssignedCount ?? 0) },
      { label: 'Completed', value: Number(completedCount ?? 0) },
      { label: 'Overdue', value: Number(overdueCount ?? 0) },
    ];
  } catch (err) {
    console.error('getReviewerStats error', err);
    return [];
  }
}

export async function getActivities(limit = 10): Promise<Activity[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, status, created_at, proposal:proposals(title)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((r: any) => ({
      id: r.id,
      title: r.proposal?.title || 'Untitled',
      type: r.status,
      date: r.created_at,
    }));
  } catch (err) {
    console.error('getActivities error', err);
    return [];
  }
}

export async function getUpcomingDeadlines(limit = 20): Promise<DeadlineItem[]> {
  try {
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    const { data, error } = await supabase
      .from('reviews')
      .select('id, due_date, proposal:proposals(title)')
      .gte('due_date', today)
      .order('due_date', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((r: any) => ({
      id: r.id,
      title: r.proposal?.title || 'Untitled',
      due: r.due_date,
      dueDate: r.due_date,
    }));
  } catch (err) {
    console.error('getUpcomingDeadlines error', err);
    return [];
  }
}