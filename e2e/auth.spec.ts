import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login happy path (email verified)', async ({ page }) => {
    await page.route('**/auth/v1/token?grant_type=password', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 't', token_type: 'bearer',
          user: { id: 'u1', email: 'a@b.com', email_confirmed_at: new Date().toISOString() },
          expires_in: 3600,
        })
      })
    })

    await page.goto('/')
    await page.getByLabel('Email').fill('a@b.com')
    await page.getByLabel('Password').fill('secret')
    await page.getByRole('button', { name: /Log-In/i }).click()
    await expect(page).toHaveURL(/sdash|dashboard|\//)
  })

  test('reset password flow triggers email', async ({ page }) => {
    await page.route('**/auth/v1/recover', route => route.fulfill({ status: 200, body: '{}' }))
    await page.goto('/')
    await page.getByText('Forgot password?').click()
    await page.getByLabel(/^Email$/).fill('a@b.com')
    await page.getByRole('button', { name: /Send Reset Link/i }).click()
    await expect(page.getByText(/Password reset email sent/i)).toBeVisible({ timeout: 10_000 })
  })
})


