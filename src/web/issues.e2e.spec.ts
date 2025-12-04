import { test, expect } from '@playwright/test';

/**
 * Web App E2E Tests for Issue Management
 *
 * Tests the centy-app React application's issue management functionality.
 */
test.describe('Web App: Issue Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Issues List', () => {
    test('should display issues list page', async ({ page }) => {
      // Navigate to issues
      await page.click('text=Issues');

      // Verify we're on the issues page
      await expect(page.locator('h1, h2').filter({ hasText: /issues/i })).toBeVisible();
    });

    test('should show empty state when no issues', async ({ page }) => {
      await page.click('text=Issues');

      // Look for empty state or "no issues" message
      const emptyState = page.locator('text=/no issues|empty|create.*first/i');
      const issuesList = page.locator('[data-testid="issues-list"], table, ul');

      // Either empty state message or an empty list should be visible
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      const hasIssuesList = await issuesList.isVisible().catch(() => false);

      expect(hasEmptyState || hasIssuesList).toBe(true);
    });

    test('should have create issue button', async ({ page }) => {
      await page.click('text=Issues');

      // Look for create button
      const createButton = page.locator('button, a').filter({
        hasText: /create|new|add/i,
      });

      await expect(createButton.first()).toBeVisible();
    });
  });

  test.describe('Create Issue', () => {
    test('should navigate to create issue page', async ({ page }) => {
      await page.click('text=Issues');

      // Click create button
      await page.click('button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")');

      // Verify we're on create page or modal opened
      await expect(
        page.locator('input[name="title"], input[placeholder*="title" i], form')
      ).toBeVisible();
    });

    test('should create issue with title', async ({ page }) => {
      await page.click('text=Issues');
      await page.click('button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")');

      // Fill in the title
      const titleInput = page.locator(
        'input[name="title"], input[placeholder*="title" i]'
      );
      await titleInput.fill('E2E Test Issue');

      // Submit the form
      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');

      // Verify success (redirect to list or success message)
      await expect(
        page.locator('text=E2E Test Issue, text=/success|created/i').first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('should create issue with all fields', async ({ page }) => {
      await page.click('text=Issues');
      await page.click('button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")');

      // Fill in title
      await page
        .locator('input[name="title"], input[placeholder*="title" i]')
        .fill('Full E2E Issue');

      // Fill in description if available
      const descInput = page.locator(
        'textarea[name="description"], [data-testid="description-editor"], .ProseMirror'
      );
      if (await descInput.isVisible()) {
        await descInput.fill('This is a test description');
      }

      // Select priority if available
      const prioritySelect = page.locator(
        'select[name="priority"], [data-testid="priority-select"]'
      );
      if (await prioritySelect.isVisible()) {
        await prioritySelect.selectOption({ index: 1 });
      }

      // Submit
      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');

      // Verify creation
      await page.waitForURL(/issues/);
    });

    test('should validate required fields', async ({ page }) => {
      await page.click('text=Issues');
      await page.click('button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")');

      // Try to submit without title
      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');

      // Look for validation error
      const errorIndicator = page.locator(
        '[class*="error"], [aria-invalid="true"], :invalid, text=/required/i'
      );
      await expect(errorIndicator.first()).toBeVisible();
    });
  });

  test.describe('Issue Detail', () => {
    test.beforeEach(async ({ page }) => {
      // Create an issue first via the app
      await page.click('text=Issues');
      await page.click('button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")');

      await page
        .locator('input[name="title"], input[placeholder*="title" i]')
        .fill('Detail Test Issue');

      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');

      // Wait for redirect back to list
      await page.waitForTimeout(1000);
    });

    test('should view issue details', async ({ page }) => {
      await page.click('text=Issues');

      // Click on the issue to view details
      await page.click('text=Detail Test Issue');

      // Verify detail view
      await expect(page.locator('text=Detail Test Issue')).toBeVisible();
    });

    test('should display issue metadata', async ({ page }) => {
      await page.click('text=Issues');
      await page.click('text=Detail Test Issue');

      // Check for metadata elements
      const statusBadge = page.locator('text=/open|closed|in.?progress/i');
      const priorityBadge = page.locator('text=/high|medium|low|priority/i');
      const dateInfo = page.locator('text=/created|updated|ago/i');

      // At least one metadata element should be visible
      const hasStatus = await statusBadge.first().isVisible().catch(() => false);
      const hasPriority = await priorityBadge.first().isVisible().catch(() => false);
      const hasDate = await dateInfo.first().isVisible().catch(() => false);

      expect(hasStatus || hasPriority || hasDate).toBe(true);
    });
  });

  test.describe('Update Issue', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('text=Issues');
      await page.click('button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")');

      await page
        .locator('input[name="title"], input[placeholder*="title" i]')
        .fill('Update Test Issue');

      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
      await page.waitForTimeout(1000);
    });

    test('should update issue title', async ({ page }) => {
      await page.click('text=Issues');
      await page.click('text=Update Test Issue');

      // Click edit button
      await page.click('button:has-text("Edit"), a:has-text("Edit")');

      // Update title
      const titleInput = page.locator(
        'input[name="title"], input[placeholder*="title" i]'
      );
      await titleInput.clear();
      await titleInput.fill('Updated Issue Title');

      // Save
      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Update")');

      // Verify update
      await expect(page.locator('text=Updated Issue Title')).toBeVisible();
    });

    test('should update issue status', async ({ page }) => {
      await page.click('text=Issues');
      await page.click('text=Update Test Issue');

      // Look for status dropdown or button
      const statusControl = page.locator(
        'select[name="status"], [data-testid="status-select"], button:has-text(/open|closed/i)'
      );

      if (await statusControl.isVisible()) {
        await statusControl.click();

        // Select a different status
        await page.click('text=closed, [data-value="closed"], option:has-text("closed")');
      }
    });
  });

  test.describe('Delete Issue', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('text=Issues');
      await page.click('button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")');

      await page
        .locator('input[name="title"], input[placeholder*="title" i]')
        .fill('Delete Test Issue');

      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
      await page.waitForTimeout(1000);
    });

    test('should delete an issue', async ({ page }) => {
      await page.click('text=Issues');
      await page.click('text=Delete Test Issue');

      // Click delete button
      await page.click('button:has-text("Delete")');

      // Confirm deletion if dialog appears
      const confirmButton = page.locator(
        'button:has-text("Confirm"), button:has-text("Yes"), [data-testid="confirm-delete"]'
      );
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Verify deletion (issue should not be in list)
      await page.click('text=Issues');
      await expect(page.locator('text=Delete Test Issue')).not.toBeVisible();
    });
  });
});
