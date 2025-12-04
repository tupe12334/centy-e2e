import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execa } from 'execa';
import { mkdir, rm, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const CLI_PATH = join(process.cwd(), '../centy-cli/bin/run.js');

describe('CLI: Issue Management', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `centy-cli-test-${randomUUID()}`);
    await mkdir(testDir, { recursive: true });

    // Initialize centy in the test directory
    await execa(CLI_PATH, ['init'], {
      cwd: testDir,
      env: { CENTY_CWD: testDir },
    });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('create issue', () => {
    it('should create a new issue with title only', async () => {
      const { stdout, exitCode } = await execa(
        CLI_PATH,
        ['create', 'issue', '--title', 'Test Issue'],
        {
          cwd: testDir,
          env: { CENTY_CWD: testDir },
        }
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Created issue');
    });

    it('should create an issue with all options', async () => {
      const { stdout, exitCode } = await execa(
        CLI_PATH,
        [
          'create',
          'issue',
          '--title',
          'Bug: Login fails',
          '--description',
          'Users cannot log in',
          '--priority',
          'high',
          '--status',
          'open',
        ],
        {
          cwd: testDir,
          env: { CENTY_CWD: testDir },
        }
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Created issue');
    });

    it('should create issue files on disk', async () => {
      await execa(
        CLI_PATH,
        ['create', 'issue', '--title', 'Disk Test Issue'],
        {
          cwd: testDir,
          env: { CENTY_CWD: testDir },
        }
      );

      const issuesDir = join(testDir, '.centy', 'issues');
      const issuesFolders = await import('node:fs/promises').then((fs) =>
        fs.readdir(issuesDir)
      );

      expect(issuesFolders.length).toBe(1);

      const issueFolder = join(issuesDir, issuesFolders[0]);
      expect(existsSync(join(issueFolder, 'issue.md'))).toBe(true);
      expect(existsSync(join(issueFolder, 'metadata.json'))).toBe(true);
    });

    it('should set correct metadata', async () => {
      await execa(
        CLI_PATH,
        [
          'create',
          'issue',
          '--title',
          'Priority Issue',
          '--priority',
          'high',
          '--status',
          'in-progress',
        ],
        {
          cwd: testDir,
          env: { CENTY_CWD: testDir },
        }
      );

      const issuesDir = join(testDir, '.centy', 'issues');
      const issuesFolders = await import('node:fs/promises').then((fs) =>
        fs.readdir(issuesDir)
      );
      const metadataPath = join(issuesDir, issuesFolders[0], 'metadata.json');
      const metadata = JSON.parse(await readFile(metadataPath, 'utf-8'));

      expect(metadata.priority).toBe(1); // high = 1
      expect(metadata.status).toBe('in-progress');
    });
  });

  describe('list issues', () => {
    it('should list no issues when empty', async () => {
      const { stdout, exitCode } = await execa(CLI_PATH, ['list', 'issues'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });

      expect(exitCode).toBe(0);
      expect(stdout).toContain('0');
    });

    it('should list created issues', async () => {
      // Create some issues
      await execa(CLI_PATH, ['create', 'issue', '--title', 'Issue 1'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });
      await execa(CLI_PATH, ['create', 'issue', '--title', 'Issue 2'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });

      const { stdout, exitCode } = await execa(CLI_PATH, ['list', 'issues'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });

      expect(exitCode).toBe(0);
      expect(stdout).toContain('2');
      expect(stdout).toContain('Issue 1');
      expect(stdout).toContain('Issue 2');
    });

    it('should filter by status', async () => {
      await execa(
        CLI_PATH,
        ['create', 'issue', '--title', 'Open Issue', '--status', 'open'],
        { cwd: testDir, env: { CENTY_CWD: testDir } }
      );
      await execa(
        CLI_PATH,
        ['create', 'issue', '--title', 'Closed Issue', '--status', 'closed'],
        { cwd: testDir, env: { CENTY_CWD: testDir } }
      );

      const { stdout, exitCode } = await execa(
        CLI_PATH,
        ['list', 'issues', '--status', 'open'],
        { cwd: testDir, env: { CENTY_CWD: testDir } }
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Open Issue');
      expect(stdout).not.toContain('Closed Issue');
    });
  });

  describe('get issue', () => {
    it('should get issue by display number', async () => {
      await execa(
        CLI_PATH,
        ['create', 'issue', '--title', 'Get Test Issue', '--description', 'Test description'],
        { cwd: testDir, env: { CENTY_CWD: testDir } }
      );

      const { stdout, exitCode } = await execa(
        CLI_PATH,
        ['get', 'issue', '1'],
        { cwd: testDir, env: { CENTY_CWD: testDir } }
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Get Test Issue');
    });

    it('should handle non-existent issue', async () => {
      const result = await execa(CLI_PATH, ['get', 'issue', '999'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
        reject: false,
      });

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('update issue', () => {
    it('should update issue title', async () => {
      await execa(CLI_PATH, ['create', 'issue', '--title', 'Original Title'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });

      const { exitCode } = await execa(
        CLI_PATH,
        ['update', 'issue', '1', '--title', 'Updated Title'],
        { cwd: testDir, env: { CENTY_CWD: testDir } }
      );

      expect(exitCode).toBe(0);

      const { stdout } = await execa(CLI_PATH, ['get', 'issue', '1'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });

      expect(stdout).toContain('Updated Title');
    });

    it('should update issue status', async () => {
      await execa(CLI_PATH, ['create', 'issue', '--title', 'Status Test'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });

      await execa(CLI_PATH, ['update', 'issue', '1', '--status', 'closed'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });

      const { stdout } = await execa(CLI_PATH, ['get', 'issue', '1'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });

      expect(stdout).toContain('closed');
    });
  });

  describe('delete issue', () => {
    it('should delete an issue', async () => {
      await execa(CLI_PATH, ['create', 'issue', '--title', 'To Delete'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });

      // Verify it exists
      const listBefore = await execa(CLI_PATH, ['list', 'issues'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });
      expect(listBefore.stdout).toContain('1 issue');

      // Delete it
      const { exitCode } = await execa(CLI_PATH, ['delete', 'issue', '1'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });
      expect(exitCode).toBe(0);

      // Verify it's gone
      const listAfter = await execa(CLI_PATH, ['list', 'issues'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });
      expect(listAfter.stdout).toContain('0');
    });
  });
});
