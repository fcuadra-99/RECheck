import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as DBModule from '../../src/DB';

// Ensure navigator.userAgent exists for getClientInfo
// @ts-ignore
global.navigator = { userAgent: 'vitest-agent' } as any;

vi.mock('../../src/DB.tsx', () => {
  const auth = {
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    signOut: vi.fn(),
  };

  const supabase = {
    auth,
    from: vi.fn(),
    rpc: vi.fn(),
  } as any;

  return { supabase };
});

// Some code paths import '../DB' (resolved to src/DB.tsx). Cover both.
vi.mock('../../src/services/../DB', async () => {
  const mocked = await vi.importMock<any>('../../src/DB.tsx');
  return mocked;
});

// Import after mocks so service picks up mocked supabase
import { DigitalSignatureService } from '../../src/services/digitalSignatureService';

const getMockedSupabase = () => (DBModule as any).supabase as {
  auth: any;
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
};

describe('DigitalSignatureService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sign as researcher when columns exist', async () => {
    const supabase = getMockedSupabase();

    const update = vi.fn().mockResolvedValue({ error: null });
    const eq = vi.fn().mockReturnValue({ error: null });
    (supabase.from as any).mockReturnValue({
      update: (vals: any) => ({ eq: (col: string, id: string) => ({ error: null }) }),
    });

    const result = await DigitalSignatureService.signAsResearcher('rep-1', {
      signatureImage: 'data:image/png;base64,AAA',
      userId: 'u1',
      userRole: 'researcher',
    });

    expect(result).toEqual({ success: true });
    expect(supabase.from).toHaveBeenCalledWith('deviation_reports');
  });

  it('should fallback to status update when signature columns are missing', async () => {
    const supabase = getMockedSupabase();

    const firstUpdate = { error: { message: 'column does not exist' } };

    (supabase.from as any).mockImplementation((table: string) => {
      return {
        update: (vals: any) => ({
          eq: (col: string, id: string) => {
            if (vals.researcher_signature) return firstUpdate;
            return { error: null };
          },
        }),
      };
    });

    const result = await DigitalSignatureService.signAsResearcher('rep-2', {
      signatureImage: 'data:image/png;base64,BBB',
      userId: 'u2',
      userRole: 'researcher',
    });

    expect(result).toEqual({ success: true });
  });

  it('should prevent chairperson signing before researcher', async () => {
    const supabase = getMockedSupabase();

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'deviation_reports') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { signature_status: 'unsigned', researcher_signature: null }, error: null }) }) }),
        };
      }
      return {};
    });

    const result = await DigitalSignatureService.signAsChairperson('rep-3', {
      signatureImage: 'img',
      userId: 'chair-1',
      userRole: 'chairperson',
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/researcher first/i);
  });

  it('should sign as chairperson and create audit log', async () => {
    const supabase = getMockedSupabase();

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'deviation_reports') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { signature_status: 'researcher_signed', researcher_signature: 'x' }, error: null }),
            }),
          }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        };
      }
      if (table === 'signature_audit_log') {
        return {
          insert: () => Promise.resolve({ error: null }),
        };
      }
      return {};
    });

    const result = await DigitalSignatureService.signAsChairperson('rep-4', {
      signatureImage: 'img',
      userId: 'chair-2',
      userRole: 'chairperson',
    });

    expect(result).toEqual({ success: true });
  });

  it('should verify signatures and document integrity', async () => {
    const supabase = getMockedSupabase();

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'deviation_reports') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({
            data: {
              researcher_signature: 'r',
              researcher_signature_date: '2024-01-01',
              researcher_signature_hash: 'h1',
              chairperson_signature: 'c',
              chairperson_signature_date: '2024-01-02',
              chairperson_signature_hash: 'h2',
              signature_status: 'both_signed',
            },
            error: null,
          }) }) }),
        };
      }
      return {};
    });

    (supabase.rpc as any).mockResolvedValue({ data: true });

    const result = await DigitalSignatureService.verifySignatures('rep-5');
    expect(result.documentIntegrity).toBe(true);
    expect(result.researcher.isValid).toBe(true);
    expect(result.chairperson.isValid).toBe(true);
  });

  it('should return invalid verifications on error', async () => {
    const supabase = getMockedSupabase();

    (supabase.from as any).mockImplementation(() => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('not found') }) }) }),
    }));

    const result = await DigitalSignatureService.verifySignatures('rep-6');
    expect(result.documentIntegrity).toBe(false);
    expect(result.researcher.isValid).toBe(false);
    expect(result.chairperson.isValid).toBe(false);
  });

  it('should fetch signature audit trail', async () => {
    const supabase = getMockedSupabase();

    (supabase.from as any).mockImplementation((table: string) => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [{ id: 1 }], error: null }) }) }),
    }));

    const res = await DigitalSignatureService.getSignatureAuditTrail('rep-7');
    expect(res.success).toBe(true);
    expect(res.data).toEqual([{ id: 1 }]);
  });

  it('should handle error when fetching signature audit trail', async () => {
    const supabase = getMockedSupabase();

    (supabase.from as any).mockImplementation((table: string) => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: null, error: new Error('db') }) }) }),
    }));

    const res = await DigitalSignatureService.getSignatureAuditTrail('rep-8');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('should allow researcher owner who has not signed yet', async () => {
    const supabase = getMockedSupabase();

    (supabase.from as any).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: { reported_by_user: 'u10', researcher_signature: null, chairperson_signature: null },
            error: null,
          }),
        }),
      }),
    }));

    const res = await DigitalSignatureService.canUserSign('rep-9', 'u10', 'researcher');
    expect(res).toEqual({ canSign: true });
  });

  it('should deny researcher who is not owner', async () => {
    const supabase = getMockedSupabase();
    (supabase.from as any).mockImplementation(() => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { reported_by_user: 'owner', researcher_signature: null }, error: null }) }) }),
    }));

    const res = await DigitalSignatureService.canUserSign('rep-10', 'other', 'researcher');
    expect(res.canSign).toBe(false);
    expect(res.reason).toMatch(/only sign your own/i);
  });

  it('should allow chairperson only after researcher signed and chairperson not signed', async () => {
    const supabase = getMockedSupabase();
    (supabase.from as any).mockImplementation(() => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { researcher_signature: 'r', chairperson_signature: null }, error: null }) }) }),
    }));

    const res = await DigitalSignatureService.canUserSign('rep-11', 'c1', 'chairperson');
    expect(res).toEqual({ canSign: true });
  });

  it('should use fallback query when signature columns missing', async () => {
    const supabase = getMockedSupabase();

    (supabase.from as any).mockImplementation((table: string) => ({
      select: (sel?: any) => ({
        eq: () => ({
          single: () => {
            if (sel && typeof sel === 'string' && sel.includes('signature_status')) {
              return Promise.resolve({ data: null, error: { message: 'column missing' } });
            }
            return Promise.resolve({ data: { reported_by_user: 'uX', id: 'rep' }, error: null });
          },
        }),
      }),
    }));

    const r1 = await DigitalSignatureService.canUserSign('rep-12', 'uX', 'researcher');
    expect(r1).toEqual({ canSign: true });

    const r2 = await DigitalSignatureService.canUserSign('rep-12', 'cX', 'chairperson');
    expect(r2).toEqual({ canSign: true });
  });
});


