import { join } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Get the path to the centy-cli binary.
 * In CI, centy-cli is checked out as a subdirectory.
 * In local dev, it's a sibling directory.
 */
export const getCliPath = (): string => {
  // CI path: centy-cli is checked out in the same directory
  const ciPath = join(process.cwd(), 'centy-cli/bin/run.js');
  // Local dev path: centy-cli is a sibling directory
  const devPath = join(process.cwd(), '../centy-cli/bin/run.js');

  if (existsSync(ciPath)) {
    return ciPath;
  }
  return devPath;
};

/**
 * Get the path to the centy.proto file.
 * In CI, centy-daemon is checked out as a subdirectory.
 * In local dev, it's a sibling directory.
 */
export const getProtoPath = (): string => {
  // CI path: centy-daemon is checked out in the same directory
  const ciPath = join(process.cwd(), 'centy-daemon/proto/centy.proto');
  // Local dev path: centy-daemon is a sibling directory
  const devPath = join(process.cwd(), '../centy-daemon/proto/centy.proto');

  if (existsSync(ciPath)) {
    return ciPath;
  }
  return devPath;
};
