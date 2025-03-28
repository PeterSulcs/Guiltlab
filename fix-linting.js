#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to fix any type annotations in a file
function fixAnyTypes(filePath) {
  console.log(`Fixing any types in ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Try to determine better types for common patterns
  content = content
    // Replace any in catch blocks with Error | unknown
    .replace(/catch\s*\(\s*(\w+)\s*:\s*any\s*\)/g, 'catch ($1: Error | unknown)')
    
    // Replace any in API responses with appropriate type or unknown
    .replace(/Promise<any>/g, 'Promise<unknown>')
    
    // Use Record for object types
    .replace(/Record<string,\s*any>/g, 'Record<string, unknown>');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// Function to fix unused variables in a file
function fixUnusedVars(filePath) {
  console.log(`Fixing unused vars in ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Read the file and find imports
  const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
  
  // Get all import matches
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const imports = match[1];
    const importSource = match[2];
    const importStart = match.index;
    const importEnd = importStart + match[0].length;
    
    // Split imports by comma and trim whitespace
    const importParts = imports.split(',').map(part => part.trim());
    
    // Check each import for "eslint-disable-next-line" comment
    const unusedImports = [];
    for (const part of importParts) {
      if (
        content.indexOf(`eslint-disable-next-line no-unused-vars`) === -1 &&
        content.indexOf(part, importEnd) === -1 &&
        part !== '' &&
        !part.startsWith('// ')
      ) {
        unusedImports.push(part);
      }
    }
    
    // Remove unused imports
    if (unusedImports.length > 0) {
      for (const unusedImport of unusedImports) {
        // Replace the import but keep other imports intact
        content = content.replace(
          new RegExp(`(import\\s+{[^}]*?)${unusedImport}(,\\s*|\\s*})([^}]*from\\s+['"]${importSource.replace('.', '\\.')}['"])`, 'g'),
          (match, beforePart, separator, afterPart) => {
            // If separator is just whitespace (not comma), we need to handle differently
            if (separator.trim() === '') {
              return `${beforePart}${afterPart}`;
            }
            // If separator is a comma followed by whitespace, replace with just the whitespace
            return `${beforePart}${separator.replace(',', '')}${afterPart}`;
          }
        );
      }
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// Main function
function main() {
  // Find TypeScript files
  const result = execSync('find ./src -type f -name "*.ts" -o -name "*.tsx"', { encoding: 'utf8' });
  const files = result.split('\n').filter(file => file);
  
  for (const file of files) {
    // Fix issues in the file
    try {
      fixAnyTypes(file);
      fixUnusedVars(file);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  
  console.log('Done fixing linting issues. Run "npm run lint" to check remaining issues.');
}

main(); 