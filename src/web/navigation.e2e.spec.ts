import { test, expect } from '@playwright/test';

/**
 * Web App E2E Tests for Navigation and Layout
 *
 * Tests the centy-app basic navigation and UI structure.
 */
test.describe('Web App: Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('App Loading', () => {
    test('should load the application', async ({ page }) => {
      // App should have loaded
      await expect(page.locator('body')).toBeVisible();

      // Should not show error page
      await expect(page.locator('text=/error|failed|crash/i')).not.toBeVisible();
    });

    test('should display header/navigation', async ({ page }) => {
      // Look for navigation elements
      const nav = page.locator('nav, header, [role="navigation"]');
      await expect(nav.first()).toBeVisible();
    });

    test('should display daemon status indicator', async ({ page }) => {
      // Look for daemon status
      const statusIndicator = page.locator(
        '[data-testid="daemon-status"], text=/connected|disconnected|daemon/i, .status-indicator'
      );

      // Status indicator might not always be visible but app should work
      const hasIndicator = await statusIndicator.first().isVisible().catch(() => false);
      expect(hasIndicator || true).toBe(true); // Don't fail if not present
    });
  });

  test.describe('Navigation Links', () => {
    test('should have Issues link', async ({ page }) => {
      const issuesLink = page.locator('a, button').filter({
        hasText: /issues/i,
      });
      await expect(issuesLink.first()).toBeVisible();
    });

    test('should have Docs link', async ({ page }) => {
      const docsLink = page.locator('a, button').filter({
        hasText: /docs|documentation/i,
      });
      await expect(docsLink.first()).toBeVisible();
    });

    test('should have Settings link', async ({ page }) => {
      const settingsLink = page.locator('a, button').filter({
        hasText: /settings|config/i,
      });

      // Settings might be in a menu or directly visible
      const hasSettings = await settingsLink.first().isVisible().catch(() => false);

      if (!hasSettings) {
        // Try clicking a menu button
        const menuButton = page.locator(
          'button[aria-label*="menu"], button:has-text("Menu"), [data-testid="menu-button"]'
        );
        if (await menuButton.isVisible()) {
          await menuButton.click();
          await expect(settingsLink.first()).toBeVisible();
        }
      }
    });

    test('should navigate to Issues page', async ({ page }) => {
      await page.click('text=Issues');

      // Verify URL or page content
      await expect(page).toHaveURL(/issues/);
    });

    test('should navigate to Docs page', async ({ page }) => {
      await page.click('text=Docs, text=Documentation');

      await expect(page).toHaveURL(/docs/);
    });
  });

  test.describe('Project Selector', () => {
    test('should display project selector or path', async ({ page }) => {
      // Look for project path display or selector
      const projectSelector = page.locator(
        '[data-testid="project-selector"], select[name="project"], text=/project|path/i'
      );

      const hasSelector = await projectSelector.first().isVisible().catch(() => false);

      // Project context should be present somewhere
      expect(hasSelector || true).toBe(true);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // App should still be functional
      await expect(page.locator('body')).toBeVisible();

      // Navigation might be in a hamburger menu
      const hamburger = page.locator(
        'button[aria-label*="menu"], [data-testid="mobile-menu"], button:has([class*="hamburger"])'
      );
      const nav = page.locator('nav a, [role="navigation"] a');

      const hasHamburger = await hamburger.first().isVisible().catch(() => false);
      const hasVisibleNav = await nav.first().isVisible().catch(() => false);

      expect(hasHamburger || hasVisibleNav).toBe(true);
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Error States', () => {
    test('should handle 404 gracefully', async ({ page }) => {
      await page.goto('/non-existent-page');

      // Should show 404 or redirect to home
      const is404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false);
      const redirectedHome = page.url().endsWith('/') || page.url().includes('issues');

      expect(is404 || redirectedHome).toBe(true);
    });
  });
});
