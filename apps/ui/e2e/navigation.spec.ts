import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/jarvis$/)
  })

  test('root route lands on jarvis', async ({ page }) => {
    await expect(page).toHaveURL(/\/jarvis$/)
  })

  test('jarvis ui controls are present', async ({ page }) => {
    await expect(page.getByText('⚙ Provider Configuration')).toBeVisible()
    await expect(page.getByText('🖥 AG3NT Stack')).toBeVisible()
    await expect(page.getByRole('button', { name: 'SEND ▶' })).toBeVisible()
  })
})
