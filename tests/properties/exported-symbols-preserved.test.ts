/**
 * Feature: component-structure-refactor
 * Property 2: Exported component symbols are preserved
 * 
 * **Validates: Requirements 7.4, 7.5**
 * 
 * This property test verifies that for any component that was extracted, merged,
 * or moved, the set of named exports and the presence/absence of a default export
 * in the canonical file is identical to the expected set.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Expected exports for each canonical component file after the refactor.
 * This snapshot represents the expected state after all extraction, merging, and moving operations.
 */
const EXPECTED_EXPORTS: Record<string, { default: boolean; named: string[] }> = {
  // Merged from data-col-headr.tsx (deleted) - canonical is data-column-header.tsx
  'src/components/parts/table/data-column-header.tsx': {
    default: false,
    named: ['DataTableColumnHeader', 'DataTableColumnHeaderProps'],
  },
  
  // Extracted from researcher/Dashboard.tsx and staff/Dashboard.tsx
  'src/components/parts/dashboard/AnnouncementsPage.tsx': {
    default: true,
    named: ['AnnouncementsPageProps', 'DashboardStats', 'StatsLoader'],
  },
  
  // Canonical sidebar (app-sidebar.tsx was deleted)
  'src/components/parts/navigation/neo-sidebar.tsx': {
    default: false,
    named: ['RadixSidebarDemo', 'RadixSidebarDemoProps'],
  },
  
  // Canonical breadcrumb (breadcrumbs.tsx was deleted)
  'src/components/parts/navigation/app-breadcrumb.tsx': {
    default: false,
    named: ['AppBreadcrumb', 'AppBreadcrumbProps', 'BreadcrumbPortal'],
  },
  
  // Extracted from Profile.tsx
  'src/components/parts/forms/Detail.tsx': {
    default: true,
    named: ['DetailProps'],
  },
  
  'src/components/parts/forms/EditAccountForm.tsx': {
    default: true,
    named: ['EditAccountFormProps'],
  },
  
  'src/components/parts/forms/AvatarUpload.tsx': {
    default: true,
    named: ['AvatarUploadProps'],
  },
  
  'src/components/parts/forms/ChangePasswordForm.tsx': {
    default: true,
    named: ['ChangePasswordFormProps'],
  },
};

/**
 * Extract export information from a TypeScript file
 * Returns: { default: boolean, named: string[] }
 */
function extractExports(fileContent: string): { default: boolean; named: string[] } {
  const namedExports: string[] = [];
  let hasDefaultExport = false;
  
  // Split into lines to handle comments
  const lines = fileContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip commented lines
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
      continue;
    }
    
    // Check for default export
    // Matches: export default function/class/const ComponentName
    //          export default ComponentName
    if (/export\s+default\s+/.test(line)) {
      hasDefaultExport = true;
    }
    
    // Check for named exports
    // Pattern 1: export { Name1, Name2 }
    const namedExportBraceMatch = /export\s+\{([^}]+)\}/.exec(line);
    if (namedExportBraceMatch) {
      const exports = namedExportBraceMatch[1]
        .split(',')
        .map(e => e.trim())
        .map(e => e.split(/\s+as\s+/)[0].trim()) // Handle "export { Foo as Bar }"
        .filter(e => e.length > 0);
      namedExports.push(...exports);
    }
    
    // Pattern 2: export const/let/var Name = ...
    const namedExportVarMatch = /export\s+(?:const|let|var)\s+(\w+)/.exec(line);
    if (namedExportVarMatch) {
      namedExports.push(namedExportVarMatch[1]);
    }
    
    // Pattern 3: export function Name(...) or export async function Name(...)
    const namedExportFuncMatch = /export\s+(?:async\s+)?function\s+(\w+)/.exec(line);
    if (namedExportFuncMatch) {
      namedExports.push(namedExportFuncMatch[1]);
    }
    
    // Pattern 4: export class Name
    const namedExportClassMatch = /export\s+class\s+(\w+)/.exec(line);
    if (namedExportClassMatch) {
      namedExports.push(namedExportClassMatch[1]);
    }
    
    // Pattern 5: export interface Name or export type Name
    const namedExportTypeMatch = /export\s+(?:interface|type)\s+(\w+)/.exec(line);
    if (namedExportTypeMatch) {
      namedExports.push(namedExportTypeMatch[1]);
    }
  }
  
  // Remove duplicates and sort for consistent comparison
  const uniqueNamedExports = Array.from(new Set(namedExports)).sort();
  
  return {
    default: hasDefaultExport,
    named: uniqueNamedExports,
  };
}

describe('Property 2: Exported component symbols are preserved', () => {
  it('should verify all canonical component files export the expected symbols', { timeout: 10000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const failures: Array<{ file: string; expected: any; actual: any }> = [];
    
    // Check each canonical component file
    for (const [relativePath, expectedExports] of Object.entries(EXPECTED_EXPORTS)) {
      const filePath = path.join(projectRoot, relativePath);
      
      // Verify file exists
      if (!fs.existsSync(filePath)) {
        failures.push({
          file: relativePath,
          expected: expectedExports,
          actual: { error: 'File does not exist' },
        });
        continue;
      }
      
      // Read and parse exports
      const content = fs.readFileSync(filePath, 'utf-8');
      const actualExports = extractExports(content);
      
      // Compare exports
      const defaultMatches = actualExports.default === expectedExports.default;
      const namedMatches = 
        actualExports.named.length === expectedExports.named.length &&
        actualExports.named.every((name, idx) => name === expectedExports.named[idx]);
      
      if (!defaultMatches || !namedMatches) {
        failures.push({
          file: relativePath,
          expected: expectedExports,
          actual: actualExports,
        });
      }
    }
    
    // Assert no failures
    if (failures.length > 0) {
      const errorMessage = `Found ${failures.length} export mismatch(es):\n` +
        failures.map(({ file, expected, actual }) =>
          `  - ${file}\n` +
          `    Expected: default=${expected.default}, named=[${expected.named.join(', ')}]\n` +
          `    Actual:   default=${actual.default}, named=[${actual.named?.join(', ') || 'N/A'}]`
        ).join('\n');
      
      throw new Error(errorMessage);
    }
    
    expect(failures).toEqual([]);
  });
  
  it('should verify export preservation with property-based testing', { timeout: 10000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const canonicalFiles = Object.keys(EXPECTED_EXPORTS);
    
    // Property: For any canonical component file, its exports must match the expected snapshot
    fc.assert(
      fc.property(
        fc.constantFrom(...canonicalFiles),
        (relativePath) => {
          const filePath = path.join(projectRoot, relativePath);
          const expectedExports = EXPECTED_EXPORTS[relativePath];
          
          // File must exist
          if (!fs.existsSync(filePath)) {
            throw new Error(
              `Canonical component file does not exist:\n` +
              `  File: ${relativePath}`
            );
          }
          
          // Parse actual exports
          const content = fs.readFileSync(filePath, 'utf-8');
          const actualExports = extractExports(content);
          
          // Verify default export matches
          if (actualExports.default !== expectedExports.default) {
            throw new Error(
              `Default export mismatch:\n` +
              `  File: ${relativePath}\n` +
              `  Expected default export: ${expectedExports.default}\n` +
              `  Actual default export: ${actualExports.default}`
            );
          }
          
          // Verify named exports match
          const expectedNamed = expectedExports.named.sort();
          const actualNamed = actualExports.named.sort();
          
          if (JSON.stringify(expectedNamed) !== JSON.stringify(actualNamed)) {
            throw new Error(
              `Named exports mismatch:\n` +
              `  File: ${relativePath}\n` +
              `  Expected named exports: [${expectedNamed.join(', ')}]\n` +
              `  Actual named exports: [${actualNamed.join(', ')}]`
            );
          }
          
          return true;
        }
      ),
      { numRuns: 5, timeout: 8000 } // Reduced for faster execution
    );
  });
  
  it('should verify no unexpected exports in canonical files', { timeout: 8000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    
    // For each canonical file, ensure it doesn't export symbols not in the expected list
    for (const [relativePath, expectedExports] of Object.entries(EXPECTED_EXPORTS)) {
      const filePath = path.join(projectRoot, relativePath);
      
      if (!fs.existsSync(filePath)) {
        continue; // Already caught by previous test
      }
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const actualExports = extractExports(content);
      
      // Check for unexpected named exports
      const unexpectedExports = actualExports.named.filter(
        name => !expectedExports.named.includes(name)
      );
      
      if (unexpectedExports.length > 0) {
        throw new Error(
          `Unexpected exports found:\n` +
          `  File: ${relativePath}\n` +
          `  Unexpected: [${unexpectedExports.join(', ')}]\n` +
          `  Expected only: [${expectedExports.named.join(', ')}]`
        );
      }
    }
  });
});
