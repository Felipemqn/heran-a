import { test, expect } from '@playwright/test'

test('home renders hero', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Jera Horizonte/i })).toBeVisible()
})
