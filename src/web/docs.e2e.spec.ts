import { test, expect } from '@playwright/test';

/**
 * Web App E2E Tests for Documentation Management
 *
 * Tests the centy-app React application's documentation functionality.
 */
test.describe('Web App: Documentation Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Docs List', () => {
    test('should display docs list page', async ({ page }) => {
      // Navigate to docs
      await page.click('text=Docs, text=Documentation, a[href*="docs"]');

      // Verify we're on the docs page
      await expect(
        page.locator('h1, h2').filter({ hasText: /docs|documentation/i })
      ).toBeVisible();
    });

    test('should have create doc button', async ({ page }) => {
      await page.click('text=Docs, text=Documentation, a[href*="docs"]');

      const createButton = page.locator('button, a').filter({
        hasText: /create|new|add/i,
      });

      await expect(createButton.first()).toBeVisible();
    });
  });

  test.describe('Create Doc', () => {
    test('should navigate to create doc page', async ({ page }) => {
      await page.click('text=Docs, text=Documentation, a[href*="docs"]');

      await page.click('button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")');

      // Verify we're on create page
      await expect(
        page.locator('input[name="title"], input[placeholder*="title" i], form')
      ).toBeVisible();
    });

    test('should create doc with title', async ({ page }) => {
      await page.click('text=Docs, text=Documentation, a[href*="docs"]');
      await page.click('button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")');

      // Fill in the title
      await page
        .locator('input[name="title"], input[placeholder*="title" i]')
        .fill('E2E Test Documentation');

      // Submit
      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');

      // Verify success
      await expect(
        page.locator('text=E2E Test Documentation, text=/success|created/i').first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('should create doc with content', async ({ page }) => {
      await page.click('text=Docs, text=Documentation, a[href*="docs"]');
      await page.click('button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")');

      // Fill in title
      await page
        .locator('input[name="title"], input[placeholder*="title" i]')
        .fill('Doc With Content');

      // Fill in content
      const contentEditor = page.locator(
        'textarea[name="content"], [data-testid="content-editor"], .ProseMirror, [contenteditable="true"]'
      );
      if (await contentEditor.isVisible()) {
        await contentEditor.click();
        await page.keyboard.type('# Introduction\n\nThis is test content.');
      }

      // Submit
      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');

      await page.waitForURL(/docs/);
    });
  });

  test.describe('Doc Detail', () => {
    test.beforeEach(async ({ page }) => {
      // Create a doc first
      await page.click('text=Docs, text=Documentation, a[href*="docs"]');
      await page.click('button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")');

      await page
        .locator('input[name="title"], input[placeholder*="title" i]')
        .fill('Detail Test Doc');

      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
      await page.waitForTimeout(1000);
    });

    test('should view doc details', async ({ page }) => {
      await page.click('text=Docs, text=Documentation, a[href*="docs"]');
      await page.click('text=Detail Test Doc');

      await expect(page.locator('text=Detail Test Doc')).toBeVisible();
    });

    test('should display doc content', async ({ page }) => {
      await page.click('text=Docs, text=Documentation, a[href*="docs"]');
      await page.click('text=Detail Test Doc');

      // Content area should be visible
      const contentArea = page.locator(
        '[data-testid="doc-content"], .doc-content, article, .prose, .ProseMirror'
      );
      await expect(contentArea.first()).toBeVisible();
    });
  });

  test.describe('Update Doc', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('text=Docs, text=Documentation, a[href*="docs"]');
      await page.click('button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")');

      await page
        .locator('input[name="title"], input[placeholder*="title" i]')
        .fill('Update Test Doc');

      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
      await page.waitForTimeout(1000);
    });

    test('should update doc title', async ({ page }) => {
      await page.click('text=Docs, text=Documentation, a[href*="docs"]');
      await page.click('text=Update Test Doc');

      // Click edit button
      await page.click('button:has-text("Edit"), a:has-text("Edit")');

      // Update title
      const titleInput = page.locator(
        'input[name="title"], input[placeholder*="title" i]'
      );
      await titleInput.clear();
      await titleInput.fill('Updated Doc Title');

      // Save
      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Update")');

      // Verify update
      await expect(page.locator('text=Updated Doc Title')).toBeVisible();
    });

    test('should update doc content', async ({ page }) => {
      await page.click('text=Docs, text=Documentation, a[href*="docs"]');
      await page.click('text=Update Test Doc');

      await page.click('button:has-text("Edit"), a:has-text("Edit")');

      // Update content
      const contentEditor = page.locator(
        'textarea[name="content"], [data-testid="content-editor"], .ProseMirror, [contenteditable="true"]'
      );
      if (await contentEditor.isVisible()) {
        await contentEditor.click();
        await page.keyboard.type('Updated content here.');
      }

      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
    });
  });

  test.describe('Delete Doc', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('text=Docs, text=Documentation, a[href*="docs"]');
      await page.click('button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")');

      await page
        .locator('input[name="title"], input[placeholder*="title" i]')
        .fill('Delete Test Doc');

      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
      await page.waitForTimeout(1000);
    });

    test('should delete a doc', async ({ page }) => {
      await page.click('text=Docs, text=Documentation, a[href*="docs"]');
      await page.click('text=Delete Test Doc');

      // Click delete button
      await page.click('button:has-text("Delete")');

      // Confirm deletion
      const confirmButton = page.locator(
        'button:has-text("Confirm"), button:has-text("Yes"), [data-testid="confirm-delete"]'
      );
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Verify deletion
      await page.click('text=Docs, text=Documentation, a[href*="docs"]');
      await expect(page.locator('text=Delete Test Doc')).not.toBeVisible();
    });
  });
});
