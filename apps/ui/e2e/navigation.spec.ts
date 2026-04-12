import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('pai-dashboard-shell')).toBeVisible()
  })

  test('quick links point to the dashboard sections', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'View dashboard route' })).toHaveAttribute('href', '/dashboard')
    await expect(page.getByRole('link', { name: 'Review architecture' })).toHaveAttribute('href', '/dashboard#architecture')
    await expect(page.getByRole('link', { name: 'Inspect memory runtime' })).toHaveAttribute('href', '/dashboard#memory')
  })

  test('live runtime summary renders current gateway and memory state', async ({ page }) => {
    await expect(page.getByTestId('pai-dashboard-live')).toContainText('Gateway')
    await expect(page.getByTestId('pai-dashboard-live')).toContainText('Model')
    await expect(page.getByTestId('pai-dashboard-live')).toContainText('Agent')
    await expect(page.getByTestId('pai-dashboard-signals')).toContainText('Ratings')
    await expect(page.getByTestId('pai-dashboard-signals')).toContainText('Learnings')
    await expect(page.getByTestId('pai-dashboard-signals')).toContainText('Agents')
  })
})
