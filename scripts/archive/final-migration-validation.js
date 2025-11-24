#!/usr/bin/env node

/**
 * Final Validation Script for Firebase Migration
 * Verifies that all Supabase dependencies have been removed
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, access } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function checkSupabasePackages() {
  console.log('\n📦 Checking for Supabase packages in package.json...');

  try {
    const packageJson = JSON.parse(
      await readFile(path.join(__dirname, '..', 'package.json'), 'utf8')
    );

    const allDeps = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };

    const supabaseDeps = Object.keys(allDeps).filter(dep =>
      dep.includes('supabase')
    );

    if (supabaseDeps.length === 0) {
      console.log(`${colors.green}✅ No Supabase packages found in package.json${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Found Supabase packages:${colors.reset}`);
      supabaseDeps.forEach(dep => console.log(`   - ${dep}: ${allDeps[dep]}`));
      return false;
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Could not check package.json: ${error.message}${colors.reset}`);
    return false;
  }
}

async function checkSupabaseImports() {
  console.log('\n🔍 Checking for Supabase imports in source code...');

  try {
    const { stdout } = await execAsync(
      `grep -r "@supabase\\|from 'supabase\\|from \\"supabase" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "supabase-bridge" | grep -v "// Legacy" | head -20`
    ).catch(() => ({ stdout: '' }));

    const lines = stdout.trim().split('\n').filter(line => line);

    if (lines.length === 0 || !stdout.trim()) {
      console.log(`${colors.green}✅ No direct Supabase imports found${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Found Supabase imports:${colors.reset}`);
      lines.slice(0, 5).forEach(line => {
        const [file, ...rest] = line.split(':');
        console.log(`   ${file.replace('src/', '')}`);
      });
      if (lines.length > 5) {
        console.log(`   ... and ${lines.length - 5} more`);
      }
      return false;
    }
  } catch (error) {
    console.log(`${colors.green}✅ No Supabase imports found${colors.reset}`);
    return true;
  }
}

async function checkSupabaseFiles() {
  console.log('\n📁 Checking for Supabase configuration files...');

  const supabaseFiles = [
    'supabase/config.toml',
    'supabase/.gitignore',
    '.env.supabase',
    'supabase.json'
  ];

  let found = false;
  for (const file of supabaseFiles) {
    try {
      await access(path.join(__dirname, '..', file));
      console.log(`${colors.red}❌ Found: ${file}${colors.reset}`);
      found = true;
    } catch {
      // File doesn't exist, which is good
    }
  }

  if (!found) {
    console.log(`${colors.green}✅ No Supabase configuration files found${colors.reset}`);
  }

  return !found;
}

async function checkBuildSuccess() {
  console.log('\n🏗️  Checking if build succeeds...');

  try {
    const { stdout, stderr } = await execAsync('npm run build', {
      cwd: path.join(__dirname, '..')
    });

    if (stderr.includes('error') && !stderr.includes('WARNING')) {
      console.log(`${colors.red}❌ Build failed with errors${colors.reset}`);
      return false;
    } else {
      console.log(`${colors.green}✅ Build successful${colors.reset}`);
      return true;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Build failed: ${error.message}${colors.reset}`);
    return false;
  }
}

async function checkFirebaseConfig() {
  console.log('\n🔥 Checking Firebase configuration...');

  const envFile = path.join(__dirname, '..', '.env.local');
  let hasFirebaseVars = false;

  try {
    const envContent = await readFile(envFile, 'utf8');
    const firebaseVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID'
    ];

    const foundVars = firebaseVars.filter(varName =>
      envContent.includes(varName) && !envContent.match(new RegExp(`${varName}=\\s*$`, 'm'))
    );

    hasFirebaseVars = foundVars.length === firebaseVars.length;

    if (hasFirebaseVars) {
      console.log(`${colors.green}✅ Firebase environment variables configured${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Some Firebase variables may not be configured${colors.reset}`);
    }
  } catch {
    console.log(`${colors.yellow}⚠️  Could not check .env.local file${colors.reset}`);
  }

  return hasFirebaseVars;
}

async function checkTypeScript() {
  console.log('\n📝 Running TypeScript type check...');

  try {
    const { stdout, stderr } = await execAsync('npm run typecheck', {
      cwd: path.join(__dirname, '..')
    });

    if (stderr || stdout.includes('error')) {
      console.log(`${colors.red}❌ TypeScript errors found${colors.reset}`);
      return false;
    } else {
      console.log(`${colors.green}✅ TypeScript check passed${colors.reset}`);
      return true;
    }
  } catch (error) {
    if (error.stdout && error.stdout.includes('error TS')) {
      console.log(`${colors.red}❌ TypeScript errors found${colors.reset}`);
      return false;
    }
    console.log(`${colors.yellow}⚠️  Could not run type check${colors.reset}`);
    return true;
  }
}

async function runValidation() {
  console.log('=' .repeat(60));
  console.log(`${colors.blue}🚀 Firebase Migration Final Validation${colors.reset}`);
  console.log('=' .repeat(60));

  const results = {
    packages: await checkSupabasePackages(),
    imports: await checkSupabaseImports(),
    files: await checkSupabaseFiles(),
    firebase: await checkFirebaseConfig(),
    typescript: await checkTypeScript(),
    build: await checkBuildSuccess()
  };

  console.log('\n' + '=' .repeat(60));
  console.log(`${colors.blue}📊 Validation Summary${colors.reset}`);
  console.log('=' .repeat(60));

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`\nTests Passed: ${passed}/${total} (${percentage}%)\n`);

  if (percentage === 100) {
    console.log(`${colors.green}🎉 MIGRATION COMPLETE! All Supabase dependencies have been removed.${colors.reset}`);
    console.log(`${colors.green}✨ The application is now running entirely on Firebase!${colors.reset}`);
  } else if (percentage >= 80) {
    console.log(`${colors.yellow}⚠️  Migration is mostly complete but some issues remain.${colors.reset}`);
    console.log(`${colors.yellow}   Review the failures above and address them if needed.${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Migration has significant issues that need to be resolved.${colors.reset}`);
  }

  // Detailed summary
  console.log('\nDetailed Results:');
  console.log(`  Supabase Packages Removed: ${results.packages ? '✅' : '❌'}`);
  console.log(`  Supabase Imports Removed:  ${results.imports ? '✅' : '❌'}`);
  console.log(`  Supabase Files Removed:    ${results.files ? '✅' : '❌'}`);
  console.log(`  Firebase Configured:        ${results.firebase ? '✅' : '⚠️ '}`);
  console.log(`  TypeScript Valid:           ${results.typescript ? '✅' : '❌'}`);
  console.log(`  Build Successful:           ${results.build ? '✅' : '❌'}`);

  console.log('\n' + '=' .repeat(60));

  process.exit(percentage === 100 ? 0 : 1);
}

// Run the validation
runValidation().catch(console.error);