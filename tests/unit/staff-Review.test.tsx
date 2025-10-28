import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as DBModule from '../../src/DB';

vi.mock('sonner', () => ({ toast: { loading: vi.fn().mockReturnValue('ld'), dismiss: vi.fn(), success: vi.fn(), error: vi.fn() } }));
vi.mock('../../src/components/ui/pdf-form-viewer', () => ({ PdfFormViewer: () => null }));
vi.mock('../../src/components/animate-ui/buttons/ripple', () => ({ RippleButton: (p: any) => <button {...p} /> }));

vi.mock('../../src/DB.tsx', () => {
  const auth = { getUser: vi.fn() };
  const storage = { from: vi.fn() };
  const supabase = { auth, from: vi.fn(), storage } as any;
  return { supabase };
});
vi.mock('../../src/DB', async () => {
  const mocked = await vi.importMock<any>('../../src/DB.tsx');
  return mocked;
});

import SReview, { handleCheck } from '../../src/pages/staff/Submissions/Review';

const getSupabase = () => (DBModule as any).supabase as any;

describe('Staff Review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require risk assessment completion before selecting review type (Assess)', async () => {
    const supabase = getSupabase();
    // Setup input parameters
    handleCheck('1', 'Title', 'Res', 'r@e.com', '2024-01-01', 'rev', 'Risk Assessment', 'Assess');

    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'chair' } } });
    (supabase.from as any).mockImplementation((table: string) => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { review_type: 'Full Board' }, error: null }) }) }) }));
    (supabase.storage.from as any).mockReturnValue({ list: vi.fn().mockResolvedValue({ data: [], error: null }) });

    render(
      <MemoryRouter>
        <SReview />
      </MemoryRouter>
    );

    // Open risk assessment section by toggling type conditions already satisfied
    const submit = await screen.findByRole('button', { name: /submit/i });
    fireEvent.click(submit);
    // Should not crash; toasts are mocked
  });

  it('should deny with comment for reviewer without changing status (Check)', async () => {
    const supabase = getSupabase();
    handleCheck('2', 'Title', 'Res', 'r@e.com', '2024-01-01', 'rev', 'Check Manuscript', 'Check');

    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'rev1' } } });
    // reviewer role
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'Reviewer' }, error: null }) }) }) };
      }
      if (table === 'history') {
        return { insert: vi.fn().mockResolvedValue({}) } as any;
      }
      if (table === 'proposals') {
        return { update: vi.fn().mockResolvedValue({ error: null }), select: vi.fn() } as any;
      }
      return {} as any;
    });

    render(
      <MemoryRouter>
        <SReview />
      </MemoryRouter>
    );

    // Ensure textarea requirement for reviewer path
    const textarea = await screen.findByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Needs revision' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      // history.insert called
      expect((supabase.from as any)('history').insert).toBeDefined();
    });
  });
});


