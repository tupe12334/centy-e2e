import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execa } from 'execa';
import { mkdir, rm, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getCliPath } from '../fixtures/paths.js';

const CLI_PATH = getCliPath();

describe('CLI: centy init', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `centy-cli-test-${randomUUID()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should initialize a new .centy folder', async () => {
    const { stdout, exitCode } = await execa(CLI_PATH, ['init'], {
      cwd: testDir,
      env: { CENTY_CWD: testDir },
    });

    expect(exitCode).toBe(0);
    expect(stdout).toContain('Successfully initialized');
    expect(existsSync(join(testDir, '.centy'))).toBe(true);
    expect(existsSync(join(testDir, '.centy', '.centy-manifest.json'))).toBe(true);
  });

  it('should create the correct folder structure', async () => {
    await execa(CLI_PATH, ['init'], {
      cwd: testDir,
      env: { CENTY_CWD: testDir },
    });

    // Check all expected directories
    expect(existsSync(join(testDir, '.centy', 'issues'))).toBe(true);
    expect(existsSync(join(testDir, '.centy', 'docs'))).toBe(true);
    expect(existsSync(join(testDir, '.centy', 'assets'))).toBe(true);
    expect(existsSync(join(testDir, '.centy', 'templates'))).toBe(true);
  });

  it('should create a valid manifest', async () => {
    await execa(CLI_PATH, ['init'], {
      cwd: testDir,
      env: { CENTY_CWD: testDir },
    });

    const manifestPath = join(testDir, '.centy', '.centy-manifest.json');
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest).toHaveProperty('schema_version');
    expect(manifest).toHaveProperty('centy_version');
    expect(manifest).toHaveProperty('created_at');
    expect(manifest).toHaveProperty('updated_at');
  });

  it('should handle already initialized directory', async () => {
    // Initialize first time
    await execa(CLI_PATH, ['init'], {
      cwd: testDir,
      env: { CENTY_CWD: testDir },
    });

    // Try to initialize again
    const { stdout, exitCode } = await execa(CLI_PATH, ['init'], {
      cwd: testDir,
      env: { CENTY_CWD: testDir },
    });

    expect(exitCode).toBe(0);
    // Should handle gracefully (reconcile or report already initialized)
    expect(existsSync(join(testDir, '.centy'))).toBe(true);
  });
});
