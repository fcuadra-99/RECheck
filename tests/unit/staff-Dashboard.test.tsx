import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import * as DBModule from '../../src/DB';

vi.mock('../../src/components/parts/chart-line-multi', () => ({
  ChartLineMultiple: () => null,
}));

vi.mock('../../src/DB.tsx', () => {
  const supabase = {
    from: vi.fn(),
  } as any;
  return { supabase };
});

// Also support '@/DB'
vi.mock('../../src/DB', async () => {
  const mocked = await vi.importMock<any>('../../src/DB.tsx');
  return mocked;
});

import AnnouncementsPage from '../../src/pages/staff/Dashboard';

const getSupabase = () => (DBModule as any).supabase as { from: ReturnType<typeof vi.fn> };

describe('Announcements Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should filter announcements by audience for researcher role', async () => {
    const supabase = getSupabase();

    (supabase.from as any).mockImplementation((table: string) => ({
      select: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [
        { id: 1, title: 'All', audience: 'all', created_at: '2024-01-01' },
        { id: 2, title: 'Committee', audience: 'committee', created_at: '2024-01-01' },
        { id: 3, title: 'Students', audience: 'students', created_at: '2024-01-01' },
      ], error: null }) }) }),
    }));

    render(<AnnouncementsPage user={{ id: 'u1' }} profile={{ role: 'Researcher', email: 'r@e.com', fname: '', lname: '', org: '', avatar: '', }} />);

    await waitFor(() => expect(screen.getByText('Announcements')).toBeInTheDocument());
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Students')).toBeInTheDocument();
    expect(screen.queryByText('Committee')).not.toBeInTheDocument();
  });

  it('should create announcement and reload list (chairperson)', async () => {
    const supabase = getSupabase();

    // First load
    (supabase.from as any).mockImplementation((table: string) => ({
      select: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }),
      insert: () => Promise.resolve({ error: null }),
    }));

    render(<AnnouncementsPage user={{ id: 'u1' }} profile={{ role: 'Chairperson', email: 'c@e.com', fname: '', lname: '', org: '', avatar: '' }} />);

    // Open New dialog
    fireEvent.click(await screen.findByRole('button', { name: /new/i }));

    // Fill inputs
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'T' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'D' } });

    // Mock reload returning the new item
    (supabase.from as any).mockImplementation((table: string) => ({
      select: () => ({ order: () => Promise.resolve({ data: [{ id: 9, title: 'T', audience: 'all', created_at: '2024-01-01' }], error: null }) }),
      insert: () => Promise.resolve({ error: null }),
    }));

    fireEvent.click(screen.getByRole('button', { name: /post/i }));

    await waitFor(() => expect(screen.getAllByText('T')[0]).toBeInTheDocument());
  });
});


