#!/usr/bin/env node

import { spawn } from 'child_process';

const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

console.log('🔍 Verifying Apply.codes MCP Server Tools...\n');

setTimeout(() => {
  const listRequest = JSON.stringify({
    jsonrpc: "2.0", 
    id: 1,
    method: "tools/list"
  }) + '\n';
  
  server.stdin.write(listRequest);
}, 2000);

server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    try {
      const response = JSON.parse(line);
      
      if (response.id === 1 && response.result) {
        const tools = response.result.tools;
        console.log(`✅ Total tools: ${tools.length}\n`);
        
        // Check for boolean_search
        const booleanSearch = tools.find(t => t.name === 'boolean_search');
        if (booleanSearch) {
          console.log('✅ boolean_search tool found:');
          console.log(`   Description: ${booleanSearch.description}`);
        } else {
          console.log('❌ boolean_search tool NOT found');
        }
        
        // List all tools
        console.log('\n📋 All available tools:');
        tools.forEach(t => {
          const marker = t.description.includes('PRIMARY') ? '🎯' : 
                        t.description.includes('DEPRECATED') ? '⚠️' : '•';
          console.log(`   ${marker} ${t.name}`);
        });
        
        setTimeout(() => {
          server.kill();
          process.exit(0);
        }, 500);
      }
    } catch (e) {
      // Ignore parse errors
    }
  });
});

server.stderr.on('data', (data) => {
  if (data.toString().includes('tools')) {
    console.log(`[Server] ${data.toString().trim()}`);
  }
});

setTimeout(() => {
  console.log('\n⏱️ Timeout');
  server.kill();
  process.exit(1);
}, 10000);