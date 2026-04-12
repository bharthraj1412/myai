import { test, expect } from '@playwright/test'

test.describe('UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('pai-dashboard-shell')).toBeVisible()
  })

  test('home page renders the PAI dashboard shell', async ({ page }) => {
    await expect(page.getByText('PAI Control Plane')).toBeVisible()
    await expect(page.getByText('AG3NT as a persistent personal AI infrastructure layer.')).toBeVisible()
    await expect(page.getByTestId('pai-dashboard-live')).toBeVisible()
    await expect(page.getByTestId('pai-dashboard-signals')).toBeVisible()
  })

  test('core PAI sections render', async ({ page }) => {
    await expect(page.getByTestId('pai-dashboard-architecture')).toBeVisible()
    await expect(page.getByTestId('pai-dashboard-telos')).toBeVisible()
    await expect(page.getByTestId('pai-dashboard-agents')).toBeVisible()
    await expect(page.getByText('Algorithm and memory as live system state')).toBeVisible()
    await expect(page.getByText('TELOS drives the assistant')).toBeVisible()
    await expect(page.getByText('Specialist agent roster')).toBeVisible()
  })

  test('correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/AG3NT/)
  })
})
