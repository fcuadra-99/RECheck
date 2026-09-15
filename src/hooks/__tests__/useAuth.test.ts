// import { renderHook, waitFor, act } from '@testing-library/react'
// import useAuth from '@/hooks/useAuth'
// import { supabase } from '@/DB'

// describe('useAuth', () => {
//   it('initially loads user and updates on auth changes', async () => {
//     ;(supabase.auth.getUser as any).mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
//     const { result } = renderHook(() => useAuth())
//     await waitFor(() => expect(result.current.loading).toBe(false))
//     expect(result.current.user?.id).toBe('u1')

//     const call = (supabase.auth.onAuthStateChange as any).mock.calls[0]
//     const cb = call?.[0] || call?.[1]
//     act(() => (cb && cb('SIGNED_OUT', null)))
//     expect(result.current.user).toBeNull()
//   })
// })


