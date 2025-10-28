import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LoginForm } from '@/components/parts/login-form'
import { supabase } from '@/DB'

vi.mock('sonner', () => ({ toast: { loading: vi.fn(() => 'id'), success: vi.fn(), error: vi.fn(), dismiss: vi.fn() } }))

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>
  )
}

describe('LoginForm', () => {
  it('submits credentials and blocks unverified users', async () => {
    ;(supabase.auth.signInWithPassword as any).mockResolvedValueOnce({ data: { user: { email_confirmed_at: null } }, error: null })
    renderWithRouter()
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com', id: 'email' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'secret', id: 'password' } })
    fireEvent.click(screen.getByRole('button', { name: /Log-In/i }))
    await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalled())
  })

  it('sends reset password email with cooldown', async () => {
    renderWithRouter()
    fireEvent.click(screen.getByText(/Forgot password/i))
    const forgotEmailInput = screen.getByLabelText('Email', { selector: 'input#forgot-email' })
    fireEvent.change(forgotEmailInput, { target: { value: 'a@b.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }))
    await waitFor(() => expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalled())
  })
})


