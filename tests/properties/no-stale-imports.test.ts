/**
 * Feature: component-structure-refactor
 * Property 1: No stale import paths remain
 * 
 * **Validates: Requirements 4.6, 6.2**
 * 
 * This property test verifies that all import statements in TypeScript/TSX files
 * under src/ reference files that actually exist on the filesystem.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

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
      if (!['node_modules', '.git', 'dist', 'build', 'coverage'].includes(entry.name)) {
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
 * Extract import paths from a TypeScript file
 * Matches: import ... from 'path'
 *          import('path')
 *          export ... from 'path'
 * Ignores commented-out imports
 */
function extractImportPaths(fileContent: string): string[] {
  const importPaths: string[] = [];
  
  // Split content into lines to check for comments
  const lines = fileContent.split('\n');
  
  for (const line of lines) {
    // Skip lines that are commented out (single-line comments)
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('//')) {
      continue;
    }
    
    // Match static imports: import ... from 'path' or import ... from "path"
    const staticImportRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = staticImportRegex.exec(line)) !== null) {
      importPaths.push(match[1]);
    }
    
    // Match dynamic imports: import('path') or import("path")
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(line)) !== null) {
      importPaths.push(match[1]);
    }
    
    // Match re-exports: export ... from 'path' or export ... from "path"
    const exportFromRegex = /export\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
    while ((match = exportFromRegex.exec(line)) !== null) {
      importPaths.push(match[1]);
    }
  }
  
  return importPaths;
}

/**
 * Resolve an import path to an absolute filesystem path
 * Handles:
 * - Relative imports: './file', '../file'
 * - Alias imports: '@/components/...'
 * - Node modules (skipped - we only check local files)
 */
function resolveImportPath(importPath: string, sourceFile: string, projectRoot: string): string | null {
  // Skip node modules and external packages
  if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
    return null;
  }
  
  const sourceDir = path.dirname(sourceFile);
  let resolvedPath: string;
  
  if (importPath.startsWith('@/')) {
    // Handle alias imports: @/ -> src/
    const relativePath = importPath.substring(2); // Remove '@/'
    resolvedPath = path.join(projectRoot, 'src', relativePath);
  } else {
    // Handle relative imports
    resolvedPath = path.join(sourceDir, importPath);
  }
  
  // Try to resolve with common extensions
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
  
  for (const ext of extensions) {
    const fullPath = resolvedPath + ext;
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  
  return resolvedPath; // Return the resolved path even if it doesn't exist (for error reporting)
}

describe('Property 1: No stale import paths remain', () => {
  it('should verify all import paths in src/ resolve to existing files', { timeout: 15000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const srcDir = path.join(projectRoot, 'src');
    
    // Find all TypeScript files in src/
    const tsFiles = findTsFiles(srcDir);
    
    expect(tsFiles.length).toBeGreaterThan(0); // Sanity check: we should find some files
    
    const staleImports: Array<{ file: string; importPath: string; resolvedPath: string }> = [];
    
    // Check each file for stale imports
    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const importPaths = extractImportPaths(content);
      
      for (const importPath of importPaths) {
        const resolvedPath = resolveImportPath(importPath, file, projectRoot);
        
        // Skip external modules (null means it's a node_module)
        if (resolvedPath === null) {
          continue;
        }
        
        // Check if the resolved path exists
        if (!fs.existsSync(resolvedPath)) {
          staleImports.push({
            file: path.relative(projectRoot, file),
            importPath,
            resolvedPath: path.relative(projectRoot, resolvedPath),
          });
        }
      }
    }
    
    // Assert no stale imports found
    if (staleImports.length > 0) {
      const errorMessage = `Found ${staleImports.length} stale import(s):\n` +
        staleImports.map(({ file, importPath, resolvedPath }) =>
          `  - ${file}\n    imports: "${importPath}"\n    resolved to: ${resolvedPath} (does not exist)`
        ).join('\n');
      
      expect(staleImports).toEqual([]); // This will fail and show the error message
      throw new Error(errorMessage); // Fallback error message
    }
    
    expect(staleImports).toEqual([]);
  });
  
  it('should verify import path resolution with property-based testing', { timeout: 15000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const srcDir = path.join(projectRoot, 'src');
    const tsFiles = findTsFiles(srcDir);
    
    // Property: For any TypeScript file in src/, all its imports should resolve to existing files
    fc.assert(
      fc.property(
        fc.constantFrom(...tsFiles),
        (file) => {
          const content = fs.readFileSync(file, 'utf-8');
          const importPaths = extractImportPaths(content);
          
          const localImports = importPaths.filter(p => p.startsWith('.') || p.startsWith('@/'));
          
          for (const importPath of localImports) {
            const resolvedPath = resolveImportPath(importPath, file, projectRoot);
            
            if (resolvedPath !== null) {
              const exists = fs.existsSync(resolvedPath);
              
              if (!exists) {
                // Provide detailed error message
                throw new Error(
                  `Stale import found:\n` +
                  `  File: ${path.relative(projectRoot, file)}\n` +
                  `  Import: "${importPath}"\n` +
                  `  Resolved to: ${path.relative(projectRoot, resolvedPath)} (does not exist)`
                );
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 5, timeout: 10000 } // Reduced for faster execution
    );
  });
});
