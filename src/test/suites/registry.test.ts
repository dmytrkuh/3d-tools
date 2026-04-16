import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { testSuites } from '../testRegistry';

const suitesDir = dirname(fileURLToPath(import.meta.url));

describe('test registry suite', () => {
  it('has unique suite files', () => {
    const files = testSuites.map((suite) => suite.file);
    expect(new Set(files).size).toBe(files.length);
  });

  it.each(testSuites)('points to an existing test file for $area', (suite) => {
    expect(existsSync(join(suitesDir, suite.file))).toBe(true);
    expect(suite.covers.length).toBeGreaterThan(0);
  });

  it('includes the registry test itself', () => {
    expect(testSuites.some((suite) => suite.file === 'registry.test.ts')).toBe(true);
  });
});
