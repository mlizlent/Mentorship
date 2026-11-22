import { test, expect } from '@playwright/test'

test('landing page loads and shows title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/CrownPath/)
  await expect(page.locator('h1')).toContainText('Crowning African Tech.')
})

test('navigation links work', async ({ page }) => {
  await page.goto('/')
  await page.click('a:has-text("Find a Mentor")')
  await expect(page).toHaveURL(/.*\/mentors/)
})

test('design page loads', async ({ page }) => {
  await page.goto('/design')
  await expect(page.locator('h2')).toContainText('System Design')
})
