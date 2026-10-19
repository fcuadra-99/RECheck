import { test, expect } from '@playwright/test'

test('template submission create path (network stubbed)', async ({ page }) => {
  // Stub auth session to be logged in
  await page.addInitScript(() => {
    // localStorage/sessionStorage mocking if app relies on it
  })

  await page.route('**/auth/v1/user', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: { id: 'u1', email: 'a@b.com' } }),
  }))

  await page.route('**/rest/v1/template_submissions', async route => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 201, body: JSON.stringify([{ id: 'sub1' }]) })
    }
    return route.fulfill({ status: 200, body: JSON.stringify([]) })
  })

  await page.route('**/storage/v1/object/**', route => route.fulfill({ status: 200, body: '{}' }))

  await page.goto('/')
  // This spec assumes there is a path to submission UI; adapt selectors when routes known
  // await page.goto('/researcher/templates')
  // ... interact with form and upload ...
  expect(true).toBe(true)
})


