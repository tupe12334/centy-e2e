import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execa } from 'execa';
import { mkdir, rm, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const CLI_PATH = join(process.cwd(), '../centy-cli/bin/run.js');

describe('CLI: Documentation Management', () => {
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

  describe('create doc', () => {
    it('should create a new doc with title', async () => {
      const { stdout, exitCode } = await execa(
        CLI_PATH,
        ['create', 'doc', '--title', 'Getting Started'],
        {
          cwd: testDir,
          env: { CENTY_CWD: testDir },
        }
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Created');
    });

    it('should create a doc with content', async () => {
      const { exitCode } = await execa(
        CLI_PATH,
        [
          'create',
          'doc',
          '--title',
          'API Reference',
          '--content',
          '# API\n\nThis is the API documentation.',
        ],
        {
          cwd: testDir,
          env: { CENTY_CWD: testDir },
        }
      );

      expect(exitCode).toBe(0);

      // Verify file content
      const docsDir = join(testDir, '.centy', 'docs');
      const docFile = join(docsDir, 'api-reference.md');
      expect(existsSync(docFile)).toBe(true);

      const content = await readFile(docFile, 'utf-8');
      expect(content).toContain('API');
    });

    it('should generate slug from title', async () => {
      await execa(
        CLI_PATH,
        ['create', 'doc', '--title', 'My Awesome Guide'],
        {
          cwd: testDir,
          env: { CENTY_CWD: testDir },
        }
      );

      const docsDir = join(testDir, '.centy', 'docs');
      expect(existsSync(join(docsDir, 'my-awesome-guide.md'))).toBe(true);
    });

    it('should allow custom slug', async () => {
      await execa(
        CLI_PATH,
        ['create', 'doc', '--title', 'Guide', '--slug', 'custom-slug'],
        {
          cwd: testDir,
          env: { CENTY_CWD: testDir },
        }
      );

      const docsDir = join(testDir, '.centy', 'docs');
      expect(existsSync(join(docsDir, 'custom-slug.md'))).toBe(true);
    });
  });

  describe('list docs', () => {
    it('should list no docs when empty', async () => {
      const { stdout, exitCode } = await execa(CLI_PATH, ['list', 'docs'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });

      expect(exitCode).toBe(0);
      expect(stdout).toContain('0');
    });

    it('should list created docs', async () => {
      await execa(CLI_PATH, ['create', 'doc', '--title', 'Doc One'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });
      await execa(CLI_PATH, ['create', 'doc', '--title', 'Doc Two'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });

      const { stdout, exitCode } = await execa(CLI_PATH, ['list', 'docs'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });

      expect(exitCode).toBe(0);
      expect(stdout).toContain('2');
      expect(stdout).toContain('Doc One');
      expect(stdout).toContain('Doc Two');
    });
  });

  describe('get doc', () => {
    it('should get doc by slug', async () => {
      await execa(
        CLI_PATH,
        ['create', 'doc', '--title', 'Getting Started', '--content', '# Welcome\n\nHello world!'],
        { cwd: testDir, env: { CENTY_CWD: testDir } }
      );

      const { stdout, exitCode } = await execa(
        CLI_PATH,
        ['get', 'doc', 'getting-started'],
        { cwd: testDir, env: { CENTY_CWD: testDir } }
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Getting Started');
    });

    it('should handle non-existent doc', async () => {
      const result = await execa(CLI_PATH, ['get', 'doc', 'non-existent'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
        reject: false,
      });

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('update doc', () => {
    it('should update doc title', async () => {
      await execa(CLI_PATH, ['create', 'doc', '--title', 'Old Title'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });

      const { exitCode } = await execa(
        CLI_PATH,
        ['update', 'doc', 'old-title', '--title', 'New Title'],
        { cwd: testDir, env: { CENTY_CWD: testDir } }
      );

      expect(exitCode).toBe(0);
    });

    it('should update doc content', async () => {
      await execa(
        CLI_PATH,
        ['create', 'doc', '--title', 'Content Test', '--content', 'Original content'],
        { cwd: testDir, env: { CENTY_CWD: testDir } }
      );

      await execa(
        CLI_PATH,
        ['update', 'doc', 'content-test', '--content', 'Updated content'],
        { cwd: testDir, env: { CENTY_CWD: testDir } }
      );

      const docsDir = join(testDir, '.centy', 'docs');
      const content = await readFile(join(docsDir, 'content-test.md'), 'utf-8');
      expect(content).toContain('Updated content');
    });
  });

  describe('delete doc', () => {
    it('should delete a doc', async () => {
      await execa(CLI_PATH, ['create', 'doc', '--title', 'To Delete'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });

      // Verify it exists
      const listBefore = await execa(CLI_PATH, ['list', 'docs'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });
      expect(listBefore.stdout).toContain('1');

      // Delete it
      const { exitCode } = await execa(CLI_PATH, ['delete', 'doc', 'to-delete'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });
      expect(exitCode).toBe(0);

      // Verify it's gone
      const listAfter = await execa(CLI_PATH, ['list', 'docs'], {
        cwd: testDir,
        env: { CENTY_CWD: testDir },
      });
      expect(listAfter.stdout).toContain('0');
    });
  });
});
