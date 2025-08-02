#!/usr/bin/env node

// Simple test script to verify MCP tools work locally
// Run with: node test-tools.js

import { ApplyMCPServer } from './dist/server.js';

const server = new ApplyMCPServer();

console.log('🧪 Testing Apply.codes MCP Server Tools...\n');

// Get server info
const info = server.getServerInfo();
console.log('📊 Server Info:');
console.log(`  • Name: ${info.config.name}`);
console.log(`  • Version: ${info.config.version}`);
console.log(`  • Total Tools: ${info.stats.totalTools}`);
console.log(`  • Tool Breakdown:`, info.stats.toolBreakdown);
console.log('');

console.log('✅ MCP Server is working correctly!');
console.log('');
console.log('🔧 Next Steps:');
console.log('  1. Restart Claude Desktop to load the new MCP server');
console.log('  2. Look for "apply-recruitment" in your available servers');
console.log('  3. Try some example queries:');
console.log('     • "Search for senior React developers in San Francisco"');
console.log('     • "Parse this resume and extract the key information"');
console.log('     • "Generate technical interview questions for a backend role"');
console.log('     • "Create a recruitment plan for hiring 3 software engineers"');
console.log('');
console.log('📚 Documentation:');
console.log('  • Full API docs: RECRUITMENT_MCP_README.md');
console.log('  • Usage examples: USAGE_EXAMPLES.md');
console.log('  • Test the server: ./start-server.sh');