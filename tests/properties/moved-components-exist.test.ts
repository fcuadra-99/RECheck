/**
 * Feature: component-structure-refactor
 * Property 6: Moved components exist at new paths with unchanged export names
 * 
 * **Validates: Requirements 6.1, 6.3**
 * 
 * This property test verifies that components moved during the reorganization
 * exist at their new paths and export the same symbol names as before the move.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Expected old→new path mapping for components that were moved during reorganization.
 * This represents the path changes made in Phase 6 of the refactor.
 */
const COMPONENT_PATH_MAPPING: Record<string, { newPath: string; exportName: string }> = {
  // Navigation components moved to navigation/
  'src/components/parts/neo-sidebar.tsx': {
    newPath: 'src/components/parts/navigation/neo-sidebar.tsx',
    exportName: 'RadixSidebarDemo',
  },
  'src/components/parts/app-breadcrumb.tsx': {
    newPath: 'src/components/parts/navigation/app-breadcrumb.tsx',
    exportName: 'AppBreadcrumb',
  },
  
  // Table components moved to table/
  'src/components/parts/data-column-header.tsx': {
    newPath: 'src/components/parts/table/data-column-header.tsx',
    exportName: 'DataTableColumnHeader',
  },
  'src/components/parts/pagination.tsx': {
    newPath: 'src/components/parts/table/pagination.tsx',
    exportName: 'DataTablePagination',
  },
  
  // Form components moved to forms/
  'src/components/parts/login-form.tsx': {
    newPath: 'src/components/parts/forms/login-form.tsx',
    exportName: 'LoginForm',
  },
  'src/components/parts/signu-form.tsx': {
    newPath: 'src/components/parts/forms/signu-form.tsx',
    exportName: 'SignupForm',
  },
  'src/components/parts/reset.tsx': {
    newPath: 'src/components/parts/forms/reset.tsx',
    exportName: 'ResetForm',
  },
  
  // Dashboard components moved to dashboard/
  'src/components/parts/chart-line-multi.tsx': {
    newPath: 'src/components/parts/dashboard/chart-line-multi.tsx',
    exportName: 'ChartLineMultiple',
  },
  
  // Dialog components moved to dialogs/
  'src/components/parts/dialogue.tsx': {
    newPath: 'src/components/parts/dialogs/dialogue.tsx',
    exportName: 'Dialogue',
  },
};

/**
 * Extract the primary export name from a TypeScript component file.
 * Looks for named exports and default exports.
 */
function extractPrimaryExportName(fileContent: string): string | null {
  const lines = fileContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip commented lines
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
      continue;
    }
    
    // Check for named export function/const/class
    const namedExportMatch = /export\s+(?:const|function|class)\s+(\w+)/.exec(line);
    if (namedExportMatch) {
      return namedExportMatch[1];
    }
    
    // Check for export { Name }
    const namedExportBraceMatch = /export\s+\{\s*(\w+)/.exec(line);
    if (namedExportBraceMatch) {
      return namedExportBraceMatch[1];
    }
    
    // Check for default export with name
    const defaultExportMatch = /export\s+default\s+(?:function\s+)?(\w+)/.exec(line);
    if (defaultExportMatch) {
      return defaultExportMatch[1];
    }
  }
  
  return null;
}

/**
 * Check if a file exports a specific symbol name (named or default export)
 */
function fileExportsSymbol(fileContent: string, symbolName: string): boolean {
  const lines = fileContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip commented lines
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
      continue;
    }
    
    // Check for named export of the symbol
    if (new RegExp(`export\\s+(?:const|function|class)\\s+${symbolName}\\b`).test(line)) {
      return true;
    }
    
    // Check for export { symbolName }
    if (new RegExp(`export\\s+\\{[^}]*\\b${symbolName}\\b[^}]*\\}`).test(line)) {
      return true;
    }
    
    // Check for default export of the symbol
    if (new RegExp(`export\\s+default\\s+(?:function\\s+)?${symbolName}\\b`).test(line)) {
      return true;
    }
  }
  
  return false;
}

describe('Property 6: Moved components exist at new paths with unchanged export names', () => {
  it('should verify all moved components exist at their new paths', { timeout: 10000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const failures: Array<{ oldPath: string; newPath: string; issue: string }> = [];
    
    // Check each component in the mapping
    for (const [oldPath, { newPath, exportName }] of Object.entries(COMPONENT_PATH_MAPPING)) {
      const newFilePath = path.join(projectRoot, newPath);
      
      // Verify new file exists
      if (!fs.existsSync(newFilePath)) {
        failures.push({
          oldPath,
          newPath,
          issue: 'File does not exist at new path',
        });
        continue;
      }
      
      // Verify old file no longer exists
      const oldFilePath = path.join(projectRoot, oldPath);
      if (fs.existsSync(oldFilePath)) {
        failures.push({
          oldPath,
          newPath,
          issue: 'File still exists at old path (should have been moved)',
        });
        continue;
      }
      
      // Verify the component exports the expected symbol
      const content = fs.readFileSync(newFilePath, 'utf-8');
      if (!fileExportsSymbol(content, exportName)) {
        failures.push({
          oldPath,
          newPath,
          issue: `Does not export expected symbol: ${exportName}`,
        });
      }
    }
    
    // Assert no failures
    if (failures.length > 0) {
      const errorMessage = `Found ${failures.length} component move issue(s):\n` +
        failures.map(({ oldPath, newPath, issue }) =>
          `  - ${oldPath} → ${newPath}\n    Issue: ${issue}`
        ).join('\n');
      
      throw new Error(errorMessage);
    }
    
    expect(failures).toEqual([]);
  });
  
  it('should verify component moves with property-based testing', { timeout: 10000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const componentMoves = Object.entries(COMPONENT_PATH_MAPPING);
    
    // Property: For any component in the move mapping, it should exist at the new path with the correct export
    fc.assert(
      fc.property(
        fc.constantFrom(...componentMoves),
        ([oldPath, { newPath, exportName }]) => {
          const newFilePath = path.join(projectRoot, newPath);
          const oldFilePath = path.join(projectRoot, oldPath);
          
          // File must exist at new path
          if (!fs.existsSync(newFilePath)) {
            throw new Error(
              `Component not found at new path:\n` +
              `  Expected: ${newPath}\n` +
              `  Original: ${oldPath}`
            );
          }
          
          // File must NOT exist at old path (should have been moved)
          if (fs.existsSync(oldFilePath)) {
            throw new Error(
              `Component still exists at old path (not moved):\n` +
              `  Old path: ${oldPath}\n` +
              `  New path: ${newPath}`
            );
          }
          
          // File must export the expected symbol
          const content = fs.readFileSync(newFilePath, 'utf-8');
          if (!fileExportsSymbol(content, exportName)) {
            throw new Error(
              `Component does not export expected symbol:\n` +
              `  File: ${newPath}\n` +
              `  Expected export: ${exportName}\n` +
              `  Original path: ${oldPath}`
            );
          }
          
          return true;
        }
      ),
      { numRuns: 5, timeout: 8000 } // Reduced for faster execution
    );
  });
  
  it('should verify export names are unchanged after move', { timeout: 8000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    
    // For each moved component, verify the export name matches exactly what was expected
    for (const [oldPath, { newPath, exportName }] of Object.entries(COMPONENT_PATH_MAPPING)) {
      const newFilePath = path.join(projectRoot, newPath);
      
      if (!fs.existsSync(newFilePath)) {
        continue; // Already caught by previous test
      }
      
      const content = fs.readFileSync(newFilePath, 'utf-8');
      const primaryExport = extractPrimaryExportName(content);
      
      // The primary export should match the expected export name
      if (primaryExport !== exportName) {
        throw new Error(
          `Export name mismatch after move:\n` +
          `  File: ${newPath} (moved from ${oldPath})\n` +
          `  Expected export: ${exportName}\n` +
          `  Actual primary export: ${primaryExport || 'none found'}`
        );
      }
      
      // Also verify using the symbol-specific check
      if (!fileExportsSymbol(content, exportName)) {
        throw new Error(
          `Expected export symbol not found:\n` +
          `  File: ${newPath} (moved from ${oldPath})\n` +
          `  Expected symbol: ${exportName}`
        );
      }
    }
  });
  
  it('should verify no components were lost during reorganization', { timeout: 8000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const expectedComponents = Object.values(COMPONENT_PATH_MAPPING);
    
    // All expected components should exist at their new paths
    for (const { newPath, exportName } of expectedComponents) {
      const filePath = path.join(projectRoot, newPath);
      
      expect(fs.existsSync(filePath)).toBe(true);
      
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(fileExportsSymbol(content, exportName)).toBe(true);
    }
    
    // Verify we have the expected number of moved components
    expect(expectedComponents.length).toBeGreaterThan(0);
  });
});