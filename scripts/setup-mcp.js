#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = (question) => new Promise(resolve => rl.question(question, resolve));

async function setupMCP() {
  console.log('🔧 Setting up MCP Server for Apply Recruitment...\n');

  try {
    // Check if we're in the right directory
    const projectRoot = join(__dirname, '..');
    const mcpServerPath = join(projectRoot, 'mcp-server');
    
    if (!existsSync(mcpServerPath)) {
      console.error('❌ Error: mcp-server directory not found.');
      console.error('   Please run this script from the apply-codes project root.');
      process.exit(1);
    }

    // Get Supabase credentials
    console.log('Please provide your Supabase credentials:');
    console.log('(You can find these in your Supabase project settings)\n');

    const supabaseUrl = process.env.SUPABASE_URL || await prompt('Supabase URL: ');
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || await prompt('Supabase Anon Key: ');
    
    console.log('\nOptional: Provide a service key for enhanced security');
    console.log('(Press Enter to skip and use anon key)\n');
    
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || await prompt('Supabase Service Key (optional): ');

    // Test connection
    console.log('\n🔍 Testing Supabase connection...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error && error.message !== 'Auth session missing!') {
        throw error;
      }
      console.log('✅ Supabase connection successful!');
    } catch (error) {
      console.error('❌ Failed to connect to Supabase:', error.message);
      console.error('   Please check your credentials and try again.');
      process.exit(1);
    }

    // Fetch secrets from Supabase
    console.log('\n📥 Fetching secrets from Supabase...');
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/get-mcp-secrets`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey || supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const secrets = await response.json();
      
      if (Object.keys(secrets).length === 0) {
        console.warn('⚠️  No secrets found in Supabase.');
        console.warn('   Make sure to set up your API keys in Supabase environment variables.');
      } else {
        console.log(`✅ Successfully fetched ${Object.keys(secrets).length} secrets`);
      }

      // Create .env file
      const envPath = join(mcpServerPath, '.env');
      const envContent = [
        '# Supabase Configuration',
        `SUPABASE_URL=${supabaseUrl}`,
        `SUPABASE_ANON_KEY=${supabaseAnonKey}`,
        supabaseServiceKey ? `SUPABASE_SERVICE_KEY=${supabaseServiceKey}` : '',
        '',
        '# API Keys (fetched from Supabase)',
        ...Object.entries(secrets).map(([key, value]) => `${key}=${value}`),
        ''
      ].filter(line => line !== undefined).join('\n');

      writeFileSync(envPath, envContent);
      console.log(`\n✅ Created .env file at: ${envPath}`);

    } catch (error) {
      console.error('❌ Failed to fetch secrets:', error.message);
      console.log('\n📝 Creating .env file with Supabase credentials only...');
      
      // Create basic .env file
      const envPath = join(mcpServerPath, '.env');
      const envContent = [
        '# Supabase Configuration',
        `SUPABASE_URL=${supabaseUrl}`,
        `SUPABASE_ANON_KEY=${supabaseAnonKey}`,
        supabaseServiceKey ? `SUPABASE_SERVICE_KEY=${supabaseServiceKey}` : '',
        '',
        '# Add your API keys here or set them in Supabase',
        '# GOOGLE_CSE_API_KEY=',
        '# GOOGLE_CSE_ID=',
        '# PERPLEXITY_API_KEY=',
        '# OPENAI_API_KEY=',
        '# ANTHROPIC_API_KEY=',
        ''
      ].filter(line => line !== undefined).join('\n');

      writeFileSync(envPath, envContent);
      console.log(`✅ Created .env file at: ${envPath}`);
      console.log('\n⚠️  Remember to add your API keys to the .env file or Supabase Edge Function');
    }

    // Build MCP server
    console.log('\n🔨 Building MCP server...');
    
    try {
      process.chdir(mcpServerPath);
      
      // Install dependencies if needed
      if (!existsSync('node_modules')) {
        console.log('📦 Installing dependencies...');
        execSync('npm install', { stdio: 'inherit' });
      }
      
      // Build the server
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ MCP server built successfully!');
    } catch (error) {
      console.error('❌ Failed to build MCP server:', error.message);
      process.exit(1);
    }

    // Generate Claude Desktop configuration
    const mcpServerDistPath = join(mcpServerPath, 'dist', 'server.js');
    const claudeConfig = {
      mcpServers: {
        'apply-recruitment': {
          command: 'node',
          args: [mcpServerDistPath],
          env: {
            SUPABASE_URL: supabaseUrl,
            SUPABASE_ANON_KEY: supabaseAnonKey
          }
        }
      }
    };

    console.log('\n📋 Claude Desktop Configuration:');
    console.log('Add this to your claude_desktop_config.json:\n');
    console.log(JSON.stringify(claudeConfig, null, 2));

    console.log('\n✅ Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Add the configuration above to your Claude Desktop config');
    console.log('2. Restart Claude Desktop');
    console.log('3. The MCP server will be available in Claude');

    if (Object.keys(secrets).length === 0) {
      console.log('\n⚠️  Important: Set up your API keys in Supabase:');
      console.log('   - Go to your Supabase project');
      console.log('   - Navigate to Edge Functions → get-mcp-secrets');
      console.log('   - Add environment variables for your API keys');
    }

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run setup
setupMCP();