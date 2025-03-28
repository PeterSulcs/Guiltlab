#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with unused variables to fix
const filesToFix = {
  'src/app/team/page.tsx': {
    unusedImports: ['useState'],
  },
  'src/components/HideNextjsBadge.tsx': {
    unusedImports: ['React'],
  },
  'src/components/Sidebar.tsx': {
    unusedVars: ['theme'],
  },
  'src/components/Heatmap.tsx': {
    unusedImports: ['ReactCalendarHeatmapValue'],
    unusedVars: ['resolvedTheme'],
    anyTypes: [
      { line: 17, pattern: ': any', replacement: ': unknown' },
      { line: 107, pattern: ': any', replacement: ': unknown' },
      { line: 365, pattern: ': any', replacement: 'as any' }, // Use type assertion instead
      { line: 410, pattern: ': any', replacement: 'as any' }, // Use type assertion instead
    ],
  },
  'src/components/Leaderboard.tsx': {
    unusedImports: ['ContributionData', 'GitHubInstance', 'GitLabInstance'],
    unusedVars: ['leaderboardData'],
  },
  'src/components/TeamLeaderboard.tsx': {
    unusedImports: ['TeamMember'],
    unusedVars: ['resolvedTheme'],
    anyTypes: [
      { line: 73, pattern: ': any', replacement: ': unknown' },
      { line: 83, pattern: ': any', replacement: ': unknown' },
      { line: 118, pattern: ': any', replacement: ': unknown' },
      { line: 128, pattern: ': any', replacement: ': unknown' },
      { line: 303, pattern: ': any', replacement: 'as any' }, // Use type assertion instead
      { line: 312, pattern: ': any', replacement: 'as any' }, // Use type assertion instead
    ],
  },
  'src/lib/gitlabApi.ts': {
    unusedImports: ['fetchCalendarContributions', 'fetchActivityContributions', 'fetchContributionsViaProfile'],
    unusedVars: ['_', 'instance', 'username', 'year'],
    anyTypes: [
      { line: 71, pattern: ': any', replacement: ': unknown' },
      { line: 255, pattern: ': any', replacement: ': unknown' },
      { line: 283, pattern: ': any', replacement: ': unknown' },
      { line: 288, pattern: ': any', replacement: ': unknown' },
      { line: 445, pattern: ': any', replacement: ': unknown' },
      { line: 483, pattern: ': any', replacement: ': unknown' },
      { line: 504, pattern: ': any', replacement: ': unknown' },
      { line: 527, pattern: ': any', replacement: ': unknown' },
    ],
  },
  'src/lib/gitlabContext.tsx': {
    unusedImports: ['RepoInstance'],
  },
  'src/lib/repoContext.tsx': {
    unusedImports: ['RepoInstance'],
  },
};

// Function to fix a specific file
function fixFile(filePath, fixes) {
  try {
    console.log(`Fixing ${filePath}`);
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    
    // Fix unused imports
    if (fixes.unusedImports && fixes.unusedImports.length > 0) {
      for (const importName of fixes.unusedImports) {
        content = content.replace(
          new RegExp(`(import\\s+{[^}]*?)\\b${importName}\\b(,\\s*|\\s*})([^}]*})`, 'g'),
          (match, before, separator, after) => {
            // If separator is just whitespace (not comma), remove the entire import
            if (separator.trim() === '') {
              return `${before}${after}`;
            }
            // Otherwise, just remove the specific import and its comma
            return `${before}${separator.replace(',', '')}${after}`;
          }
        );
        
        // If it's a direct React import
        content = content.replace(
          new RegExp(`import\\s+${importName}\\s+from\\s+['"]react['"]`, 'g'),
          ''
        );
      }
    }
    
    // Fix unused variables
    if (fixes.unusedVars && fixes.unusedVars.length > 0) {
      for (const varName of fixes.unusedVars) {
        content = content.replace(
          new RegExp(`const\\s+{[^}]*?\\b${varName}\\b[^}]*?}\\s*=`, 'g'),
          (match) => {
            return match.replace(varName, `_${varName}`);
          }
        );
      }
    }
    
    // Fix any types
    if (fixes.anyTypes && fixes.anyTypes.length > 0) {
      const newLines = [...lines];
      for (const fix of fixes.anyTypes) {
        if (fix.line <= newLines.length) {
          newLines[fix.line - 1] = newLines[fix.line - 1].replace(
            fix.pattern,
            fix.replacement
          );
        }
      }
      content = newLines.join('\n');
    }
    
    // Write the changes back to the file
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
  }
}

// Fix all specified files
for (const [filePath, fixes] of Object.entries(filesToFix)) {
  fixFile(filePath, fixes);
}

console.log('All specified errors fixed. Run npm run lint to check for remaining issues.'); 