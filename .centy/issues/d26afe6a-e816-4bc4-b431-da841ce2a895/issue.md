# Implement E2E Testing for CLI and Web App

## Overview

Implement comprehensive end-to-end testing for the Centy ecosystem covering:
1. **CLI E2E tests** - Test all CLI commands against a real daemon
2. **Web App E2E tests** - Test the React app with Playwright
3. **Daemon gRPC plain text testing** - Direct gRPC testing without TLS

## Scope

### CLI E2E Testing (Vitest + execa)
- Test `centy init` command
- Test issue CRUD operations (create, get, list, update, delete)
- Test doc CRUD operations
- Test asset management
- Test project registration

### Web App E2E Testing (Playwright)
- Test issue management flows
- Test documentation management
- Test asset uploads
- Test project selection and initialization
- Test settings page

### Daemon gRPC Plain Text Testing
- Direct gRPC client tests without browser/CLI layer
- Test all RPC methods defined in centy.proto
- Performance/load testing foundation
- Error handling verification

## Technical Approach

### Architecture
```
centy-e2e/
├── package.json
├── playwright.config.ts
├── vitest.config.ts
├── fixtures/
│   ├── daemon-manager.ts      # Start/stop daemon with temp dirs
│   ├── temp-project.ts        # Create isolated test projects
│   └── grpc-client.ts         # Direct gRPC test client
├── cli/
│   └── *.e2e.spec.ts
├── web/
│   └── *.e2e.spec.ts
├── grpc/
│   └── *.e2e.spec.ts
└── docker-compose.test.yml
```

### Key Components
1. **Daemon Manager** - Spawn daemon per test suite with isolated temp directories
2. **Project Factory** - Create .centy projects with known state for testing
3. **gRPC Test Client** - Direct proto-based client for daemon testing
4. **Docker Compose** - Reproducible CI environment

## Acceptance Criteria
- [ ] CLI commands tested against real daemon
- [ ] Web app flows tested in real browsers (Chrome, Firefox)
- [ ] gRPC methods tested directly with plain text transport
- [ ] Tests run in CI with Docker Compose
- [ ] Test coverage reports generated
- [ ] Cleanup of temp files after test runs
