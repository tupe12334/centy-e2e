# Centy E2E Tests

End-to-end testing suite for the Centy ecosystem, covering CLI, Web App, and gRPC daemon testing.

## Overview

This package provides comprehensive E2E tests for:

- **CLI Tests** - Test all centy-cli commands against a real daemon
- **gRPC Tests** - Direct gRPC plain text testing of the daemon API
- **Web App Tests** - Playwright browser tests for centy-app

## Prerequisites

- Node.js >= 20.0.0
- pnpm 10.24.0
- Running centy-daemon (on `127.0.0.1:50051` by default)
- For web tests: centy-app running (on `http://localhost:5180` by default)

## Installation

```bash
pnpm install
```

## Running Tests

### All Tests (CLI + gRPC)

```bash
pnpm test
```

### CLI Tests Only

```bash
pnpm test:cli
```

### gRPC Tests Only

```bash
pnpm test:grpc
```

### Web App Tests

```bash
# Run in headless mode
pnpm test:web

# Run with UI
pnpm test:web:ui

# Run in headed mode (see browser)
pnpm test:web:headed
```

### All Tests (including web)

```bash
pnpm test:all
```

## Project Structure

```
centy-e2e/
├── src/
│   ├── fixtures/           # Test utilities and helpers
│   │   ├── daemon-manager.ts   # Start/stop daemon instances
│   │   ├── grpc-client.ts      # gRPC client for direct testing
│   │   └── temp-project.ts     # Create temp test projects
│   ├── cli/               # CLI E2E tests
│   │   ├── init.e2e.spec.ts
│   │   ├── issues.e2e.spec.ts
│   │   └── docs.e2e.spec.ts
│   ├── grpc/              # gRPC plain text tests
│   │   ├── daemon.e2e.spec.ts
│   │   ├── init.e2e.spec.ts
│   │   ├── issues.e2e.spec.ts
│   │   ├── docs.e2e.spec.ts
│   │   ├── assets.e2e.spec.ts
│   │   └── config.e2e.spec.ts
│   └── web/               # Playwright web tests
│       ├── issues.e2e.spec.ts
│       ├── docs.e2e.spec.ts
│       └── navigation.e2e.spec.ts
├── vitest.config.ts       # Vitest config for CLI/gRPC tests
├── playwright.config.ts   # Playwright config for web tests
├── docker-compose.test.yml # Docker setup for CI
└── package.json
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CENTY_DAEMON_ADDR` | `127.0.0.1:50051` | Daemon gRPC address |
| `CENTY_APP_URL` | `http://localhost:5180` | Web app URL |
| `CI` | - | Set in CI environments |

### Test Timeouts

- Test timeout: 30 seconds
- Hook timeout: 30 seconds

## Docker Setup

For CI or isolated testing, use Docker Compose:

```bash
# Run all tests
docker-compose -f docker-compose.test.yml up --build

# Run specific test suite
docker-compose -f docker-compose.test.yml up e2e-cli
docker-compose -f docker-compose.test.yml up e2e-grpc
docker-compose -f docker-compose.test.yml up e2e-web
```

## Writing Tests

### CLI Tests

```typescript
import { execa } from 'execa';
import { join } from 'node:path';

const CLI_PATH = join(process.cwd(), '../centy-cli/bin/run.js');

it('should create an issue', async () => {
  const { stdout, exitCode } = await execa(
    CLI_PATH,
    ['create', 'issue', '--title', 'Test'],
    { cwd: testDir, env: { CENTY_CWD: testDir } }
  );
  expect(exitCode).toBe(0);
});
```

### gRPC Tests

```typescript
import { createTempProject } from '../fixtures/temp-project.js';

it('should create an issue via gRPC', async () => {
  const project = await createTempProject();

  const result = await project.client.createIssue({
    projectPath: project.path,
    title: 'Test Issue',
  });

  expect(result.success).toBe(true);
  await project.cleanup();
});
```

### Web Tests

```typescript
import { test, expect } from '@playwright/test';

test('should display issues list', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Issues');
  await expect(page.locator('h1')).toContainText('Issues');
});
```

## Test Fixtures

### `createTempProject()`

Creates an isolated temp directory with initialized `.centy` folder.

```typescript
const project = await createTempProject({
  daemonAddress: '127.0.0.1:50051',
  initialize: true,
});

// Use project.client for gRPC calls
// Use project.path for file operations

await project.cleanup(); // Clean up when done
```

### `testData`

Factory functions for test data:

```typescript
testData.createTestPng()     // Minimal valid PNG
testData.createTestJpeg()    // Minimal valid JPEG
testData.createTestText()    // Text buffer
testData.randomIssueTitle()  // Random issue title
testData.randomDocTitle()    // Random doc title
```

## Troubleshooting

### Daemon not running

```bash
cd ../centy-daemon
cargo run --release
```

### Web app not running

```bash
cd ../centy-app
pnpm dev
```

### Playwright browsers not installed

```bash
pnpm exec playwright install
```

## CI/CD

### GitHub Actions

The project includes two GitHub Actions workflows:

#### `e2e-tests.yml` - Main E2E Test Pipeline

Runs automatically on push/PR to main branch:

```
┌─────────────────┐     ┌─────────────────┐
│  build-daemon   │     │   build-cli     │
│  (Rust binary)  │     │  (Node.js CLI)  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   test-grpc     │     │    test-cli     │     │    test-web     │
│ (gRPC API tests)│     │ (CLI commands)  │     │  (Playwright)   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                       ┌─────────────────┐
                       │  test-summary   │
                       │ (Pass/Fail gate)│
                       └─────────────────┘
```

**Features:**
- Parallel test execution for faster feedback
- Artifact uploads for test results and Playwright reports
- Automatic daemon binary caching
- Failure summary with clear status

#### `e2e-docker.yml` - Docker-based Testing

Manual workflow for isolated Docker testing:

```bash
# Trigger via GitHub UI or CLI
gh workflow run e2e-docker.yml -f test_suite=all
```

**Options:**
- `all` - Run all test suites
- `grpc` - gRPC tests only
- `cli` - CLI tests only
- `web` - Playwright tests only

### CI Badges

Add to your README:

```markdown
![E2E Tests](https://github.com/YOUR_ORG/centy-e2e/actions/workflows/e2e-tests.yml/badge.svg)
```

### Local CI Simulation

Run the same tests locally using Docker:

```bash
# Build and run all tests
docker-compose -f docker-compose.test.yml up --build

# Run specific suite
docker-compose -f docker-compose.test.yml up --build e2e-grpc
```
