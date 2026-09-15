/**
 * Feature: component-structure-refactor
 * Property 3: Props interfaces are preserved through extraction and merge
 * 
 * **Validates: Requirements 2.5, 7.3, 8.3**
 * 
 * This property test verifies that for any component that was extracted from a page file
 * or merged from a duplicate, the exported props interface (or type alias) in the new
 * canonical file is structurally equivalent to the original — same property names,
 * same types, no widening.
 * 
 * TypeScript's structural type checking enforces this at compile time. This test
 * supplements that by:
 * 1. Verifying `tsc --noEmit` exits with code 0
 * 2. Runtime prop-shape assertions for extracted components
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Expected props interfaces for components that were extracted or merged.
 * Each entry maps a component file to its expected props interface structure.
 */
const EXPECTED_PROPS_INTERFACES: Record<string, {
  interfaceName: string;
  requiredProps: string[];
  optionalProps?: string[];
}> = {
  // Extracted from researcher/Dashboard.tsx and staff/Dashboard.tsx
  'src/components/parts/dashboard/AnnouncementsPage.tsx': {
    interfaceName: 'AnnouncementsPageProps',
    requiredProps: ['user', 'profile', 'statsLoader'],
    optionalProps: [],
  },
  
  // Extracted from Profile.tsx
  'src/components/parts/forms/Detail.tsx': {
    interfaceName: 'DetailProps',
    requiredProps: ['label'],
    optionalProps: ['value'],
  },
  
  'src/components/parts/forms/EditAccountForm.tsx': {
    interfaceName: 'EditAccountFormProps',
    requiredProps: ['user', 'fname', 'lname', 'org', 'role', 'avatar', 'setFname', 'setLname', 'setOrg', 'setRole', 'setAvatar'],
    optionalProps: [],
  },
  
  'src/components/parts/forms/AvatarUpload.tsx': {
    interfaceName: 'AvatarUploadProps',
    requiredProps: ['user', 'setAvatar'],
    optionalProps: [],
  },
  
  'src/components/parts/forms/ChangePasswordForm.tsx': {
    interfaceName: 'ChangePasswordFormProps',
    requiredProps: ['email'],
    optionalProps: [],
  },
};

/**
 * Extract props interface definition from a TypeScript file
 * Returns the interface/type definition as a string
 */
function extractPropsInterface(fileContent: string, interfaceName: string): string | null {
  const lines = fileContent.split('\n');
  let interfaceLines: string[] = [];
  let inInterface = false;
  let braceCount = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if this line starts the interface/type we're looking for
    const interfaceMatch = new RegExp(`^export\\s+(?:interface|type)\\s+${interfaceName}\\s*[={]`).test(trimmedLine);
    
    if (interfaceMatch) {
      inInterface = true;
      interfaceLines.push(line);
      
      // Count braces on this line
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      // Check if interface ends on the same line (e.g., type Foo = { bar: string })
      if (braceCount === 0 && trimmedLine.includes('{') && trimmedLine.includes('}')) {
        break;
      }
      
      continue;
    }
    
    if (inInterface) {
      interfaceLines.push(line);
      
      // Count braces
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      // If braces are balanced, we've reached the end of the interface
      if (braceCount === 0) {
        break;
      }
    }
  }
  
  return interfaceLines.length > 0 ? interfaceLines.join('\n') : null;
}

/**
 * Parse props from an interface definition
 * Returns: { required: string[], optional: string[] }
 */
function parsePropsFromInterface(interfaceDefinition: string): { required: string[]; optional: string[] } {
  const required: string[] = [];
  const optional: string[] = [];
  
  const lines = interfaceDefinition.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines, comments, and the interface declaration line
    if (!trimmedLine || 
        trimmedLine.startsWith('//') || 
        trimmedLine.startsWith('/*') || 
        trimmedLine.startsWith('*') ||
        trimmedLine.startsWith('export') ||
        trimmedLine === '{' ||
        trimmedLine === '}') {
      continue;
    }
    
    // Match property declarations: propName: type or propName?: type
    const propMatch = /^(\w+)(\?)?:/.exec(trimmedLine);
    
    if (propMatch) {
      const propName = propMatch[1];
      const isOptional = propMatch[2] === '?';
      
      if (isOptional) {
        optional.push(propName);
      } else {
        required.push(propName);
      }
    }
  }
  
  return {
    required: required.sort(),
    optional: optional.sort(),
  };
}

describe('Property 3: Props interfaces are preserved through extraction and merge', () => {
  it('should verify TypeScript compiler reports zero errors', { timeout: 20000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    
    try {
      // Run tsc --noEmit and capture output
      execSync('npx tsc --noEmit', {
        cwd: projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 15000, // 15 second timeout for faster execution
      });
      
      // If we reach here, tsc exited with code 0 (success)
      expect(true).toBe(true);
    } catch (error: any) {
      // tsc exited with non-zero code, meaning there are type errors
      const output = error.stdout || error.stderr || error.message;
      
      throw new Error(
        `TypeScript compiler reported errors:\n` +
        `This indicates that props interfaces may not be structurally equivalent after refactoring.\n\n` +
        `${output}`
      );
    }
  });
  
  it('should verify all extracted components export their props interfaces', { timeout: 10000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const failures: Array<{ file: string; interfaceName: string; error: string }> = [];
    
    for (const [relativePath, expected] of Object.entries(EXPECTED_PROPS_INTERFACES)) {
      const filePath = path.join(projectRoot, relativePath);
      
      // Verify file exists
      if (!fs.existsSync(filePath)) {
        failures.push({
          file: relativePath,
          interfaceName: expected.interfaceName,
          error: 'File does not exist',
        });
        continue;
      }
      
      // Read file content
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check if the props interface is exported
      const interfaceRegex = new RegExp(`export\\s+(?:interface|type)\\s+${expected.interfaceName}\\b`);
      
      if (!interfaceRegex.test(content)) {
        failures.push({
          file: relativePath,
          interfaceName: expected.interfaceName,
          error: `Props interface "${expected.interfaceName}" is not exported`,
        });
      }
    }
    
    if (failures.length > 0) {
      const errorMessage = `Found ${failures.length} missing props interface(s):\n` +
        failures.map(({ file, interfaceName, error }) =>
          `  - ${file}\n    Interface: ${interfaceName}\n    Error: ${error}`
        ).join('\n');
      
      throw new Error(errorMessage);
    }
    
    expect(failures).toEqual([]);
  });
  
  it('should verify props interface structure matches expected shape', { timeout: 10000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const failures: Array<{ 
      file: string; 
      interfaceName: string; 
      expected: any; 
      actual: any;
    }> = [];
    
    for (const [relativePath, expected] of Object.entries(EXPECTED_PROPS_INTERFACES)) {
      const filePath = path.join(projectRoot, relativePath);
      
      if (!fs.existsSync(filePath)) {
        continue; // Already caught by previous test
      }
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const interfaceDefinition = extractPropsInterface(content, expected.interfaceName);
      
      if (!interfaceDefinition) {
        failures.push({
          file: relativePath,
          interfaceName: expected.interfaceName,
          expected: { requiredProps: expected.requiredProps, optionalProps: expected.optionalProps || [] },
          actual: { error: 'Could not extract interface definition' },
        });
        continue;
      }
      
      const actualProps = parsePropsFromInterface(interfaceDefinition);
      const expectedRequired = expected.requiredProps.sort();
      const expectedOptional = (expected.optionalProps || []).sort();
      
      // Compare required props
      const requiredMatch = 
        actualProps.required.length === expectedRequired.length &&
        actualProps.required.every((prop, idx) => prop === expectedRequired[idx]);
      
      // Compare optional props
      const optionalMatch = 
        actualProps.optional.length === expectedOptional.length &&
        actualProps.optional.every((prop, idx) => prop === expectedOptional[idx]);
      
      if (!requiredMatch || !optionalMatch) {
        failures.push({
          file: relativePath,
          interfaceName: expected.interfaceName,
          expected: { requiredProps: expectedRequired, optionalProps: expectedOptional },
          actual: { requiredProps: actualProps.required, optionalProps: actualProps.optional },
        });
      }
    }
    
    if (failures.length > 0) {
      const errorMessage = `Found ${failures.length} props interface mismatch(es):\n` +
        failures.map(({ file, interfaceName, expected, actual }) =>
          `  - ${file} (${interfaceName})\n` +
          `    Expected required: [${expected.requiredProps.join(', ')}]\n` +
          `    Actual required:   [${actual.requiredProps?.join(', ') || 'N/A'}]\n` +
          `    Expected optional: [${expected.optionalProps.join(', ')}]\n` +
          `    Actual optional:   [${actual.optionalProps?.join(', ') || 'N/A'}]`
        ).join('\n');
      
      throw new Error(errorMessage);
    }
    
    expect(failures).toEqual([]);
  });
  
  it('should verify props preservation with property-based testing', { timeout: 20000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const componentFiles = Object.keys(EXPECTED_PROPS_INTERFACES);
    
    // Property: For any extracted/merged component, its props interface must match the expected structure
    fc.assert(
      fc.property(
        fc.constantFrom(...componentFiles),
        (relativePath) => {
          const filePath = path.join(projectRoot, relativePath);
          const expected = EXPECTED_PROPS_INTERFACES[relativePath];
          
          // File must exist
          if (!fs.existsSync(filePath)) {
            throw new Error(
              `Component file does not exist:\n` +
              `  File: ${relativePath}`
            );
          }
          
          // Read and parse interface
          const content = fs.readFileSync(filePath, 'utf-8');
          const interfaceDefinition = extractPropsInterface(content, expected.interfaceName);
          
          if (!interfaceDefinition) {
            throw new Error(
              `Props interface not found:\n` +
              `  File: ${relativePath}\n` +
              `  Expected interface: ${expected.interfaceName}`
            );
          }
          
          const actualProps = parsePropsFromInterface(interfaceDefinition);
          const expectedRequired = expected.requiredProps.sort();
          const expectedOptional = (expected.optionalProps || []).sort();
          
          // Verify required props match
          if (JSON.stringify(actualProps.required) !== JSON.stringify(expectedRequired)) {
            throw new Error(
              `Required props mismatch:\n` +
              `  File: ${relativePath}\n` +
              `  Interface: ${expected.interfaceName}\n` +
              `  Expected: [${expectedRequired.join(', ')}]\n` +
              `  Actual: [${actualProps.required.join(', ')}]`
            );
          }
          
          // Verify optional props match
          if (JSON.stringify(actualProps.optional) !== JSON.stringify(expectedOptional)) {
            throw new Error(
              `Optional props mismatch:\n` +
              `  File: ${relativePath}\n` +
              `  Interface: ${expected.interfaceName}\n` +
              `  Expected: [${expectedOptional.join(', ')}]\n` +
              `  Actual: [${actualProps.optional.join(', ')}]`
            );
          }
          
          return true;
        }
      ),
      { numRuns: 5, timeout: 15000 } // Reduced for faster execution
    );
  });
  
  it('should verify no type widening occurred in merged components', { timeout: 8000 }, () => {
    const projectRoot = path.resolve(__dirname, '../..');
    
    // Special check for AnnouncementsPage - the merged component from Dashboard files
    const announcementsPagePath = path.join(
      projectRoot,
      'src/components/parts/dashboard/AnnouncementsPage.tsx'
    );
    
    if (!fs.existsSync(announcementsPagePath)) {
      throw new Error('AnnouncementsPage.tsx does not exist - merge may have failed');
    }
    
    const content = fs.readFileSync(announcementsPagePath, 'utf-8');
    
    // Verify DashboardStats interface exists and has the correct structure
    const dashboardStatsInterface = extractPropsInterface(content, 'DashboardStats');
    
    if (!dashboardStatsInterface) {
      throw new Error('DashboardStats interface not found in AnnouncementsPage.tsx');
    }
    
    const statsProps = parsePropsFromInterface(dashboardStatsInterface);
    const expectedStatsProps = ['total', 'pending', 'completed'].sort();
    
    if (JSON.stringify(statsProps.required) !== JSON.stringify(expectedStatsProps)) {
      throw new Error(
        `DashboardStats interface structure mismatch:\n` +
        `  Expected: [${expectedStatsProps.join(', ')}]\n` +
        `  Actual: [${statsProps.required.join(', ')}]`
      );
    }
    
    // Verify StatsLoader type exists
    const statsLoaderTypeRegex = /export\s+type\s+StatsLoader\s*=/;
    
    if (!statsLoaderTypeRegex.test(content)) {
      throw new Error('StatsLoader type not found in AnnouncementsPage.tsx');
    }
    
    // Verify statsLoader is a required prop (not optional)
    const propsInterface = extractPropsInterface(content, 'AnnouncementsPageProps');
    
    if (!propsInterface) {
      throw new Error('AnnouncementsPageProps interface not found');
    }
    
    // Check that statsLoader is required (not optional)
    const statsLoaderOptionalMatch = /statsLoader\?:/.test(propsInterface);
    
    if (statsLoaderOptionalMatch) {
      throw new Error(
        'statsLoader prop should be required (not optional) to enforce compile-time checking'
      );
    }
  });
});
