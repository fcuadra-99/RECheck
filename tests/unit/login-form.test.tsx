// import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import { MemoryRouter } from 'react-router';
// import * as DBModule from '../../src/DB';

// // toast from sonner is used; stub minimally
// vi.mock('sonner', () => ({
//   toast: {
//     loading: vi.fn().mockReturnValue('ld'),
//     dismiss: vi.fn(),
//     success: vi.fn(),
//     error: vi.fn(),
//   },
// }));

// // Mock RippleButton and Dialogue to avoid unrelated complexity
// vi.mock('../../src/components/animate-ui/buttons/ripple', () => ({
//   RippleButton: (props: any) => <button {...props} />,
// }));
// vi.mock('../../src/components/parts/dialogue', () => ({
//   Dialogue: () => null,
// }));

// // Inputs, Labels are simple wrappers; render as-is

// vi.mock('../../src/DB.tsx', () => {
//   const auth = {
//     signInWithPassword: vi.fn(),
//     resetPasswordForEmail: vi.fn(),
//     signOut: vi.fn(),
//   };
//   return { supabase: { auth } } as any;
// });

// // Also support '@/DB' path resolution used in component
// vi.mock('../../src/DB', async () => {
//   const mocked = await vi.importMock<any>('../../src/DB.tsx');
//   return mocked;
// });

// // Alias paths used in component
// vi.mock('../../src/lib/utils', async () => {
//   return { cn: (...c: string[]) => c.filter(Boolean).join(' ') };
// });

// import { LoginForm } from '../../src/components/parts/forms/login-form';

// const getAuth = () => (DBModule as any).supabase.auth as {
//   signInWithPassword: ReturnType<typeof vi.fn>;
//   resetPasswordForEmail: ReturnType<typeof vi.fn>;
//   signOut: ReturnType<typeof vi.fn>;
// };

// describe('LoginForm', () => {
//   beforeEach(() => {
//     vi.useFakeTimers();
//     vi.clearAllMocks();
//     // window.location.origin used in reset
//     Object.defineProperty(window, 'location', {
//       value: { origin: 'http://localhost' },
//       writable: true,
//     });
//   });

//   afterEach(() => {
//     vi.useRealTimers();
//   });

//   const renderWithRouter = () =>
//     render(
//       <MemoryRouter initialEntries={["/"]}>
//         <LoginForm />
//       </MemoryRouter>
//     );

//   it('should login successfully when email is verified', async () => {
//     const auth = getAuth();
//     (auth.signInWithPassword as any).mockResolvedValue({
//       data: { user: { id: 'u1', email_confirmed_at: '2024-01-01', user_metadata: { lname: 'Doe' } } },
//       error: null,
//     });

//     renderWithRouter();

//     fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com', id: 'email' } });
//     fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pw', id: 'password' } });
//     fireEvent.click(screen.getByRole('button', { name: /log-in/i }));

//     await waitFor(() => {
//       expect(auth.signInWithPassword).toHaveBeenCalled();
//     });
//   });

//   it('should sign out and show error if email not verified', async () => {
//     const auth = getAuth();
//     (auth.signInWithPassword as any).mockResolvedValue({
//       data: { user: { id: 'u1', email_confirmed_at: null } },
//       error: null,
//     });

//     renderWithRouter();
//     fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com', id: 'email' } });
//     fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pw', id: 'password' } });
//     fireEvent.click(screen.getByRole('button', { name: /log-in/i }));

//     await waitFor(() => {
//       expect(auth.signOut).toHaveBeenCalled();
//     });
//   });

//   it('should show error when signInWithPassword returns error', async () => {
//     const auth = getAuth();
//     (auth.signInWithPassword as any).mockResolvedValue({ data: null, error: { message: 'Invalid' } });

//     renderWithRouter();
//     fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com', id: 'email' } });
//     fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pw', id: 'password' } });
//     fireEvent.click(screen.getByRole('button', { name: /log-in/i }));

//     await waitFor(() => {
//       expect(auth.signInWithPassword).toHaveBeenCalled();
//     });
//   });

//   it('should send reset password and enforce cooldown', async () => {
//     const auth = getAuth();
//     (auth.resetPasswordForEmail as any).mockResolvedValue({ error: null });

//     renderWithRouter();

//     // open forgot password dialog
//     fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));
//     const emailInput = await screen.findByLabelText(/email/i, { selector: 'input#forgot-email' });
//     fireEvent.change(emailInput, { target: { value: 'a@b.com' } });

//     fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

//     await waitFor(() => {
//       expect(auth.resetPasswordForEmail).toHaveBeenCalled();
//     });

//     // Cooldown label appears
//     expect(await screen.findByText(/please wait/i)).toBeInTheDocument();

//     // Advance timers 60s to clear cooldown
//     vi.advanceTimersByTime(60000);
//   });
// });


