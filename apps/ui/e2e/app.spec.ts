import { test, expect } from '@playwright/test'

test.describe('UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/jarvis$/)
  })

  test('home page redirects to JARVIS console', async ({ page }) => {
    await expect(page.getByText('AG3NT // JARVIS')).toBeVisible()
    await expect(page.getByText('API PROVIDER')).toBeVisible()
    await expect(page.getByText('AG3NT JARVIS — MULTI-PROVIDER AI INTERFACE')).toBeVisible()
  })

  test('jarvis quick actions render', async ({ page }) => {
    await expect(page.getByText('Project Status')).toBeVisible()
    await expect(page.getByText('Troubleshoot')).toBeVisible()
    await expect(page.getByText('SEND ▶')).toBeVisible()
  })

  test('correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/AG3NT/)
  })
})
