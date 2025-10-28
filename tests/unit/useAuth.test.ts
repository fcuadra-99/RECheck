import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../src/DB.tsx', () => {
  const auth = {
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  };
  return { supabase: { auth } } as any;
});

// Also mock '../DB' path resolution used in hooks
vi.mock('../../src/hooks/../DB', async () => {
  const mocked = await vi.importMock<any>('../../src/DB.tsx');
  return mocked;
});

import useAuth from '../../src/hooks/useAuth';
import * as DBModule from '../../src/DB';

const getAuth = () => (DBModule as any).supabase.auth as {
  getUser: ReturnType<typeof vi.fn>;
  onAuthStateChange: ReturnType<typeof vi.fn>;
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set user on mount and stop loading (success)', async () => {
    const auth = getAuth();
    (auth.getUser as any).mockResolvedValue({ data: { user: { id: 'u1' } } });
    (auth.onAuthStateChange as any).mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

    const { result } = renderHook(() => useAuth());

    // Allow pending promises to resolve
    await act(async () => {});

    expect(result.current.user).toEqual({ id: 'u1' });
    expect(result.current.loading).toBe(false);
  });

  it('should set null user on getUser failure', async () => {
    const auth = getAuth();
    (auth.getUser as any).mockRejectedValue(new Error('network'));
    (auth.onAuthStateChange as any).mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should update on auth state change and cleanup subscription', async () => {
    const unsubscribe = vi.fn();
    const auth = getAuth();
    (auth.getUser as any).mockResolvedValue({ data: { user: null } });

    let handler: any;
    (auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      handler = cb; // save
      return { data: { subscription: { unsubscribe } } };
    });

    const { result, unmount } = renderHook(() => useAuth());
    await act(async () => {});

    // simulate login
    act(() => {
      handler('SIGNED_IN', { user: { id: 'u2' } });
    });
    expect(result.current.user).toEqual({ id: 'u2' });
    expect(result.current.loading).toBe(false);

    // unmount cleanup
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});


