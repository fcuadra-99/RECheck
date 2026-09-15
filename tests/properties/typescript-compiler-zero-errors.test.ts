/**
 * Feature: component-structure-refactor
 * Property 7: TypeScript compiler reports zero errors
 * 
 * **Validates: Requirements 2.4, 4.7, 5.4, 6.4, 7.2, 8.4**
 * 
 * This property test verifies that the TypeScript compiler reports zero errors
 * after all refactoring phases are complete. It shells out to `tsc --noEmit`
 * and asserts that the exit code is 0.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { execSync } from 'child_process';
import * as path from 'path';

/**
 * Execute TypeScript compiler with --noEmit flag and return the result
 */
function runTypeScriptCompiler(projectRoot: string): { exitCode: number; output: string; error: string } {
  try {
    const output = execSync('tsc --noEmit', {
      cwd: projectRoot,
      encoding: 'utf-8',
      timeout: 20000, // 20 second timeout for faster execution
    });
    
    return {
      exitCode: 0,
      output: output.toString(),
      error: '',
    };
  } catch (error: any) {
    return {
      exitCode: error.status || 1,
      output: error.stdout?.toString() || '',
      error: error.stderr?.toString() || error.message || 'Unknown error',
    };
  }
}

/**
 * Parse TypeScript compiler output to extract error information
 */
function parseTypeScriptErrors(output: string): Array<{
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
}> {
  const errors: Array<{
    file: string;
    line: number;
    column: number;
    code: string;
    message: string;
  }> = [];
  
  const lines = output.split('\n');
  
  for (const line of lines) {
    // Match TypeScript error format: file(line,column): error TSxxxx: message
    const errorMatch = line.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
    if (errorMatch) {
      errors.push({
        file: errorMatch[1],
        line: parseInt(errorMatch[2], 10),
        column: parseInt(errorMatch[3], 10),
        code: errorMatch[4],
        message: errorMatch[5],
      });
    }
  }
  
  return errors;
}

describe('Property 7: TypeScript compiler reports zero errors', () => {
  it('should verify TypeScript compiler exits with code 0', { timeout: 45000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const result = runTypeScriptCompiler(projectRoot);
    
    if (result.exitCode !== 0) {
      const errors = parseTypeScriptErrors(result.output + result.error);
      
      let errorMessage = `TypeScript compiler failed with exit code ${result.exitCode}`;
      
      if (errors.length > 0) {
        errorMessage += `\n\nFound ${errors.length} TypeScript error(s):\n` +
          errors.slice(0, 10).map(({ file, line, column, code, message }) =>
            `  - ${path.relative(projectRoot, file)}:${line}:${column}\n` +
            `    ${code}: ${message}`
          ).join('\n');
        
        if (errors.length > 10) {
          errorMessage += `\n  ... and ${errors.length - 10} more error(s)`;
        }
      } else if (result.output || result.error) {
        errorMessage += `\n\nCompiler output:\n${result.output}${result.error}`;
      }
      
      errorMessage += `\n\nThis violates multiple requirements:\n` +
        `  - Requirement 2.4: TypeScript compiler must report zero new type errors after extraction\n` +
        `  - Requirement 4.7: TypeScript compiler must report zero new type errors after merging\n` +
        `  - Requirement 5.4: TypeScript compiler must report zero new type errors after deletion\n` +
        `  - Requirement 6.4: TypeScript compiler must report zero new type errors after reorganization\n` +
        `  - Requirement 7.2: Application must build without errors\n` +
        `  - Requirement 8.4: tsc --noEmit must exit with code 0`;
      
      throw new Error(errorMessage);
    }
    
    expect(result.exitCode).toBe(0);
  });
  
  it('should verify TypeScript compilation with property-based testing', { timeout: 180000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    
    // Property: TypeScript compiler should always exit with code 0 for this codebase
    // We run this multiple times to catch any intermittent issues
    fc.assert(
      fc.property(
        fc.constant(projectRoot), // Use constant since we're testing the same codebase
        (root) => {
          const result = runTypeScriptCompiler(root);
          
          if (result.exitCode !== 0) {
            const errors = parseTypeScriptErrors(result.output + result.error);
            
            throw new Error(
              `TypeScript compilation failed:\n` +
              `  Exit code: ${result.exitCode}\n` +
              `  Error count: ${errors.length}\n` +
              `  First error: ${errors[0] ? 
                `${path.relative(root, errors[0].file)}:${errors[0].line}:${errors[0].column} - ${errors[0].code}: ${errors[0].message}` : 
                'No structured errors found'}\n\n` +
              `This indicates that the refactoring process has introduced type errors ` +
              `that violate the requirement for zero TypeScript errors.`
            );
          }
          
          return true;
        }
      ),
      { numRuns: 3, timeout: 120000 } // Reduced for faster execution, longer timeout for compilation
    );
  });
  
  it('should verify no TypeScript configuration issues', { timeout: 30000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    
    // Check that tsconfig.json exists and is valid
    const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
    expect(require('fs').existsSync(tsconfigPath)).toBe(true);
    
    // Run a quick syntax check on tsconfig.json
    try {
      JSON.parse(require('fs').readFileSync(tsconfigPath, 'utf-8'));
    } catch (error) {
      throw new Error(`Invalid tsconfig.json: ${error}`);
    }
    
    // Verify TypeScript can find the configuration
    const result = runTypeScriptCompiler(projectRoot);
    
    // Even if there are type errors, TypeScript should not fail due to configuration issues
    // Configuration errors typically result in different exit codes or specific error messages
    if (result.exitCode !== 0) {
      const output = result.output + result.error;
      
      // Check for common configuration-related errors
      const configErrors = [
        'Cannot find a valid tsconfig.json',
        'The specified path does not exist',
        'Cannot read file',
        'Invalid compiler option',
        'Unknown compiler option',
      ];
      
      const hasConfigError = configErrors.some(errorText => 
        output.toLowerCase().includes(errorText.toLowerCase())
      );
      
      if (hasConfigError) {
        throw new Error(
          `TypeScript configuration error detected:\n${output}\n\n` +
          `This suggests an issue with tsconfig.json or TypeScript setup, ` +
          `not just type errors in the code.`
        );
      }
    }
  });
  
  it('should verify specific refactoring requirements are met', { timeout: 30000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const result = runTypeScriptCompiler(projectRoot);
    
    if (result.exitCode !== 0) {
      const errors = parseTypeScriptErrors(result.output + result.error);
      
      // Categorize errors by the refactoring phase they likely relate to
      const extractionErrors = errors.filter(error => 
        error.file.includes('Profile.tsx') || 
        error.file.includes('forms/Detail.tsx') ||
        error.file.includes('forms/EditAccountForm.tsx') ||
        error.file.includes('forms/AvatarUpload.tsx') ||
        error.file.includes('forms/ChangePasswordForm.tsx')
      );
      
      const mergeErrors = errors.filter(error =>
        error.file.includes('dashboard/AnnouncementsPage.tsx') ||
        error.file.includes('Dashboard.tsx') ||
        error.file.includes('data-column-header.tsx')
      );
      
      const reorganizationErrors = errors.filter(error =>
        error.file.includes('navigation/') ||
        error.file.includes('table/') ||
        error.file.includes('forms/') ||
        error.file.includes('dashboard/') ||
        error.file.includes('dialogs/')
      );
      
      let errorDetails = `TypeScript errors detected in refactored code:\n`;
      
      if (extractionErrors.length > 0) {
        errorDetails += `\nExtraction-related errors (${extractionErrors.length}):\n` +
          extractionErrors.slice(0, 3).map(error => 
            `  - ${path.relative(projectRoot, error.file)}:${error.line} - ${error.message}`
          ).join('\n');
      }
      
      if (mergeErrors.length > 0) {
        errorDetails += `\nMerge-related errors (${mergeErrors.length}):\n` +
          mergeErrors.slice(0, 3).map(error => 
            `  - ${path.relative(projectRoot, error.file)}:${error.line} - ${error.message}`
          ).join('\n');
      }
      
      if (reorganizationErrors.length > 0) {
        errorDetails += `\nReorganization-related errors (${reorganizationErrors.length}):\n` +
          reorganizationErrors.slice(0, 3).map(error => 
            `  - ${path.relative(projectRoot, error.file)}:${error.line} - ${error.message}`
          ).join('\n');
      }
      
      throw new Error(errorDetails);
    }
    
    expect(result.exitCode).toBe(0);
  });
});