/**
 * Feature: component-structure-refactor
 * Property 4: All App.tsx routes resolve to existing components
 * 
 * **Validates: Requirements 7.1**
 * 
 * This property test verifies that all routes defined in App.tsx reference
 * components that exist at their imported paths and export the expected symbols.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Extract import declarations from App.tsx
 * Returns array of { importPath, importedName, isDefault }
 */
function extractAppImports(appTsxContent: string): Array<{
  importPath: string;
  importedName: string;
  isDefault: boolean;
}> {
  const imports: Array<{ importPath: string; importedName: string; isDefault: boolean }> = [];
  
  // Split content into lines to process line by line
  const lines = appTsxContent.split('\n');
  
  for (const line of lines) {
    // Skip commented lines
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
      continue;
    }
    
    // Match default imports: import ComponentName from 'path'
    const defaultImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = defaultImportRegex.exec(line)) !== null) {
      imports.push({
        importPath: match[2],
        importedName: match[1],
        isDefault: true,
      });
    }
    
    // Match named imports: import { ComponentName } from 'path'
    const namedImportRegex = /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g;
    while ((match = namedImportRegex.exec(line)) !== null) {
      const namedImports = match[1].split(',').map(name => name.trim());
      const importPath = match[2];
      
      for (const namedImport of namedImports) {
        // Handle "as" aliases: ComponentName as Alias
        const aliasMatch = namedImport.match(/(\w+)\s+as\s+(\w+)/);
        const importedName = aliasMatch ? aliasMatch[1] : namedImport;
        
        imports.push({
          importPath,
          importedName,
          isDefault: false,
        });
      }
    }
    
    // Match mixed imports: import ComponentName, { OtherComponent } from 'path'
    const mixedImportRegex = /import\s+(\w+)\s*,\s*\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g;
    while ((match = mixedImportRegex.exec(line)) !== null) {
      const defaultImport = match[1];
      const namedImports = match[2].split(',').map(name => name.trim());
      const importPath = match[3];
      
      // Add default import
      imports.push({
        importPath,
        importedName: defaultImport,
        isDefault: true,
      });
      
      // Add named imports
      for (const namedImport of namedImports) {
        const aliasMatch = namedImport.match(/(\w+)\s+as\s+(\w+)/);
        const importedName = aliasMatch ? aliasMatch[1] : namedImport;
        
        imports.push({
          importPath,
          importedName,
          isDefault: false,
        });
      }
    }
  }
  
  return imports;
}

/**
 * Resolve an import path to an absolute filesystem path
 */
function resolveImportPath(importPath: string, projectRoot: string): string | null {
  // Skip node modules and external packages
  if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
    return null;
  }
  
  let resolvedPath: string;
  
  if (importPath.startsWith('@/')) {
    // Handle alias imports: @/ -> src/
    const relativePath = importPath.substring(2); // Remove '@/'
    resolvedPath = path.join(projectRoot, 'src', relativePath);
  } else {
    // Handle relative imports from src/App.tsx
    const appTsxDir = path.join(projectRoot, 'src');
    resolvedPath = path.join(appTsxDir, importPath);
  }
  
  // Try to resolve with common extensions
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
  
  for (const ext of extensions) {
    const fullPath = resolvedPath + ext;
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
  }
  
  return null; // File doesn't exist
}

/**
 * Check if a file exports the expected symbol
 */
function checkExportExists(filePath: string, exportName: string, isDefault: boolean): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (isDefault) {
      // For default exports, just check that there IS a default export
      // The import name can be anything when importing a default export
      const patterns = [
        /export\s+default\s+(?:function\s+)?(\w+)/,
        /export\s*\{\s*(\w+)\s+as\s+default\s*\}/,
        /export\s+default\s+function\s+\w+/,
        /export\s+default\s+class\s+\w+/,
        /export\s+default\s+\w+/
      ];
      
      return patterns.some(pattern => pattern.test(content));
    } else {
      // Check for named export patterns:
      // - export const ComponentName
      // - export function ComponentName
      // - export class ComponentName
      // - export { ComponentName }
      // - const ComponentName = ... export { ComponentName }
      const patterns = [
        new RegExp(`export\\s+(?:const|let|var|function|class|interface|type)\\s+${exportName}\\b`),
        new RegExp(`export\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}`),
        new RegExp(`(?:const|let|var|function|class)\\s+${exportName}[\\s\\S]*?export\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}`)
      ];
      
      return patterns.some(pattern => pattern.test(content));
    }
  } catch {
    return false;
  }
}

describe('Property 4: All App.tsx routes resolve to existing components', () => {
  it('should verify all App.tsx imports resolve to existing files with correct exports', { timeout: 10000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const appTsxPath = path.join(projectRoot, 'src', 'App.tsx');
    
    // Verify App.tsx exists
    expect(fs.existsSync(appTsxPath)).toBe(true);
    
    const appTsxContent = fs.readFileSync(appTsxPath, 'utf-8');
    const imports = extractAppImports(appTsxContent);
    
    expect(imports.length).toBeGreaterThan(0); // Sanity check: App.tsx should have imports
    
    const brokenImports: Array<{
      importPath: string;
      importedName: string;
      isDefault: boolean;
      issue: string;
    }> = [];
    
    // Check each import
    for (const { importPath, importedName, isDefault } of imports) {
      const resolvedPath = resolveImportPath(importPath, projectRoot);
      
      // Skip external modules
      if (resolvedPath === null && (!importPath.startsWith('.') && !importPath.startsWith('@/'))) {
        continue;
      }
      
      // Check if file exists
      if (resolvedPath === null || !fs.existsSync(resolvedPath)) {
        brokenImports.push({
          importPath,
          importedName,
          isDefault,
          issue: `File does not exist: ${resolvedPath || importPath}`,
        });
        continue;
      }
      
      // Check if export exists
      const exportExists = checkExportExists(resolvedPath, importedName, isDefault);
      if (!exportExists) {
        brokenImports.push({
          importPath,
          importedName,
          isDefault,
          issue: `${isDefault ? 'Default' : 'Named'} export${isDefault ? '' : ` '${importedName}'`} not found in file`,
        });
      }
    }
    
    // Assert no broken imports found
    if (brokenImports.length > 0) {
      const errorMessage = `Found ${brokenImports.length} broken import(s) in App.tsx:\n` +
        brokenImports.map(({ importPath, importedName, isDefault, issue }) =>
          `  - Import: ${isDefault ? '' : '{ '}${importedName}${isDefault ? '' : ' }'} from "${importPath}"\n    Issue: ${issue}`
        ).join('\n');
      
      throw new Error(errorMessage);
    }
    
    expect(brokenImports).toEqual([]);
  });
  
  it('should verify import resolution with property-based testing', { timeout: 10000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const appTsxPath = path.join(projectRoot, 'src', 'App.tsx');
    const appTsxContent = fs.readFileSync(appTsxPath, 'utf-8');
    const imports = extractAppImports(appTsxContent);
    
    // Filter to only local imports (not external packages)
    const localImports = imports.filter(({ importPath }) => 
      importPath.startsWith('.') || importPath.startsWith('@/')
    );
    
    expect(localImports.length).toBeGreaterThan(0); // Sanity check
    
    // Property: For any local import in App.tsx, the file should exist and export the expected symbol
    fc.assert(
      fc.property(
        fc.constantFrom(...localImports),
        ({ importPath, importedName, isDefault }) => {
          const resolvedPath = resolveImportPath(importPath, projectRoot);
          
          // File must exist
          if (resolvedPath === null || !fs.existsSync(resolvedPath)) {
            throw new Error(
              `Import resolution failed:\n` +
              `  Import: ${isDefault ? '' : '{ '}${importedName}${isDefault ? '' : ' }'} from "${importPath}"\n` +
              `  Expected file: ${resolvedPath || 'Could not resolve path'}\n` +
              `  Issue: File does not exist`
            );
          }
          
          // Export must exist
          const exportExists = checkExportExists(resolvedPath, importedName, isDefault);
          if (!exportExists) {
            throw new Error(
              `Export not found:\n` +
              `  Import: ${isDefault ? '' : '{ '}${importedName}${isDefault ? '' : ' }'} from "${importPath}"\n` +
              `  File: ${path.relative(projectRoot, resolvedPath)}\n` +
              `  Issue: ${isDefault ? 'Default export' : `Named export '${importedName}'`} not found`
            );
          }
          
          return true;
        }
      ),
      { numRuns: 5, timeout: 8000 } // Reduced for faster execution
    );
  });
  
  it('should verify specific route components are accessible', { timeout: 8000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    
    // Test specific critical route components that must exist (reduced set for faster execution)
    const criticalComponents = [
      { path: './pages/staff/Dashboard', name: 'SDashboard', isDefault: true },
      { path: './pages/researcher/Dashboard', name: 'RDashboard', isDefault: true },
      { path: './pages/Login', name: 'LoginPage', isDefault: true },
    ];
    
    for (const { path: importPath, name, isDefault } of criticalComponents) {
      const resolvedPath = resolveImportPath(importPath, projectRoot);
      
      expect(resolvedPath).not.toBeNull();
      expect(fs.existsSync(resolvedPath!)).toBe(true);
      
      const exportExists = checkExportExists(resolvedPath!, name, isDefault);
      expect(exportExists).toBe(true);
    }
  });
});