/**
 * Feature: component-structure-refactor
 * Property 5: No new `any` types introduced
 * 
 * **Validates: Requirements 8.1**
 * 
 * This property test verifies that no new `any` type annotations are introduced
 * during the refactoring process. It compares the current count of `any` types
 * against a pre-refactor baseline stored as a fixture.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Load the baseline count of `any` types from the fixture
 */
function loadBaseline(): { files: Record<string, number>; totalCount: number } {
  const baselinePath = path.resolve(__dirname, '../fixtures/any-types-baseline.json');
  
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Baseline fixture not found: ${baselinePath}`);
  }
  
  const content = fs.readFileSync(baselinePath, 'utf-8');
  const baseline = JSON.parse(content);
  
  return {
    files: baseline.files || {},
    totalCount: baseline.totalCount || 0,
  };
}

/**
 * Recursively find all .ts and .tsx files in a directory (cached)
 */
let cachedTsFiles: string[] | null = null;
function findTsFiles(dir: string): string[] {
  if (cachedTsFiles !== null) {
    return cachedTsFiles;
  }
  
  const results: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return results;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and other non-source directories
      if (!['node_modules', '.git', 'dist', 'build', 'coverage', '.vscode', '.kiro'].includes(entry.name)) {
        results.push(...findTsFiles(fullPath));
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      results.push(fullPath);
    }
  }
  
  cachedTsFiles = results;
  return results;
}

/**
 * Count occurrences of `any` type annotations in a TypeScript file
 * Matches patterns like:
 * - : any
 * - any[]
 * - any)
 * - any,
 * - any;
 * - any =
 * - any |
 * - any &
 * - any>
 * - any<
 * Excludes commented-out lines and string literals
 */
function countAnyTypes(fileContent: string): number {
  let count = 0;
  const lines = fileContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip commented lines
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
      continue;
    }
    
    // Skip lines that are entirely within string literals (basic check)
    if (trimmedLine.match(/^['"`].*['"`]$/)) {
      continue;
    }
    
    // Match various `any` type patterns
    const anyPatterns = [
      /:\s*any\b/g,           // : any
      /\bany\[\]/g,           // any[]
      /\bany\)/g,             // any)
      /\bany,/g,              // any,
      /\bany;/g,              // any;
      /\bany\s*=/g,           // any =
      /\bany\s*\|/g,          // any |
      /\bany\s*&/g,           // any &
      /\bany>/g,              // any>
      /\bany</g,              // any<
      /\(\s*any\b/g,          // (any
      /<\s*any\b/g,           // <any
      /\[\s*any\b/g,          // [any
    ];
    
    for (const pattern of anyPatterns) {
      const matches = line.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }
  }
  
  return count;
}

/**
 * Get the current count of `any` types in all TypeScript files
 */
function getCurrentAnyCounts(projectRoot: string): { files: Record<string, number>; totalCount: number } {
  const srcDir = path.join(projectRoot, 'src');
  const tsFiles = findTsFiles(srcDir);
  
  const fileCounts: Record<string, number> = {};
  let totalCount = 0;
  
  for (const file of tsFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const count = countAnyTypes(content);
    
    if (count > 0) {
      const relativePath = path.relative(projectRoot, file);
      fileCounts[relativePath] = count;
      totalCount += count;
    }
  }
  
  return { files: fileCounts, totalCount };
}

describe('Property 5: No new `any` types introduced', () => {
  it('should verify no new any types are introduced compared to baseline', { timeout: 15000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const baseline = loadBaseline();
    const current = getCurrentAnyCounts(projectRoot);
    
    const violations: Array<{ file: string; baseline: number; current: number; difference: number }> = [];
    
    // Check each file in the current state
    for (const [file, currentCount] of Object.entries(current.files)) {
      const baselineCount = baseline.files[file] || 0;
      
      if (currentCount > baselineCount) {
        violations.push({
          file,
          baseline: baselineCount,
          current: currentCount,
          difference: currentCount - baselineCount,
        });
      }
    }
    
    // Check for new files with any types (not in baseline)
    const newFilesWithAny = Object.keys(current.files).filter(
      file => !(file in baseline.files)
    );
    
    for (const file of newFilesWithAny) {
      violations.push({
        file,
        baseline: 0,
        current: current.files[file],
        difference: current.files[file],
      });
    }
    
    // Assert no violations
    if (violations.length > 0) {
      const errorMessage = `Found ${violations.length} file(s) with new 'any' types:\n` +
        violations.map(({ file, baseline, current, difference }) =>
          `  - ${file}\n` +
          `    Baseline: ${baseline} any types\n` +
          `    Current:  ${current} any types\n` +
          `    New:      +${difference} any types`
        ).join('\n') +
        `\n\nTotal baseline: ${baseline.totalCount} any types\n` +
        `Total current:  ${current.totalCount} any types\n` +
        `Net change:     ${current.totalCount > baseline.totalCount ? '+' : ''}${current.totalCount - baseline.totalCount} any types`;
      
      throw new Error(errorMessage);
    }
    
    expect(violations).toEqual([]);
  });
  
  it('should verify any type count with property-based testing', { timeout: 15000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const baseline = loadBaseline();
    const srcDir = path.join(projectRoot, 'src');
    const tsFiles = findTsFiles(srcDir);
    
    // Property: For any TypeScript file in src/, the count of `any` types should not exceed the baseline
    fc.assert(
      fc.property(
        fc.constantFrom(...tsFiles),
        (file) => {
          const relativePath = path.relative(projectRoot, file);
          const content = fs.readFileSync(file, 'utf-8');
          const currentCount = countAnyTypes(content);
          const baselineCount = baseline.files[relativePath] || 0;
          
          if (currentCount > baselineCount) {
            throw new Error(
              `New 'any' types detected:\n` +
              `  File: ${relativePath}\n` +
              `  Baseline: ${baselineCount} any types\n` +
              `  Current:  ${currentCount} any types\n` +
              `  New:      +${currentCount - baselineCount} any types\n\n` +
              `This violates Requirement 8.1: "THE Refactor_Tool SHALL not use 'any' types ` +
              `in newly created or modified component files unless the original component ` +
              `already used 'any' at that location."`
            );
          }
          
          return true;
        }
      ),
      { numRuns: 5, timeout: 8000 } // Reduced for faster execution
    );
  });
  
  it('should verify total any type count does not increase', { timeout: 10000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const baseline = loadBaseline();
    const current = getCurrentAnyCounts(projectRoot);
    
    if (current.totalCount > baseline.totalCount) {
      const increase = current.totalCount - baseline.totalCount;
      throw new Error(
        `Total 'any' type count increased by ${increase}:\n` +
        `  Baseline total: ${baseline.totalCount} any types\n` +
        `  Current total:  ${current.totalCount} any types\n\n` +
        `This violates Requirement 8.1. The refactor should not introduce new 'any' types.`
      );
    }
    
    expect(current.totalCount).toBeLessThanOrEqual(baseline.totalCount);
  });
  
  it('should verify baseline fixture is valid and up-to-date', { timeout: 8000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const baseline = loadBaseline();
    
    // Verify baseline has expected structure
    expect(baseline).toHaveProperty('files');
    expect(baseline).toHaveProperty('totalCount');
    expect(typeof baseline.files).toBe('object');
    expect(typeof baseline.totalCount).toBe('number');
    
    // Verify baseline total matches sum of individual file counts
    const calculatedTotal = Object.values(baseline.files).reduce((sum, count) => sum + count, 0);
    expect(baseline.totalCount).toBe(calculatedTotal);
    
    // Verify all baseline files still exist
    const missingFiles: string[] = [];
    for (const file of Object.keys(baseline.files)) {
      const filePath = path.join(projectRoot, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }
    
    if (missingFiles.length > 0) {
      throw new Error(
        `Baseline references ${missingFiles.length} file(s) that no longer exist:\n` +
        missingFiles.map(file => `  - ${file}`).join('\n') +
        `\n\nThe baseline fixture may need to be updated.`
      );
    }
  });
});