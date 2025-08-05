#!/usr/bin/env node

import { spawn } from 'child_process';

const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

console.log('🎯 Testing MCP Prompts...\n');

// Wait for server to start
setTimeout(() => {
  // List prompts
  const listRequest = JSON.stringify({
    jsonrpc: "2.0", 
    id: 1,
    method: "prompts/list"
  }) + '\n';
  
  server.stdin.write(listRequest);
  
  // Get recruitment guide
  setTimeout(() => {
    const getRequest = JSON.stringify({
      jsonrpc: "2.0", 
      id: 2,
      method: "prompts/get",
      params: {
        name: "recruitment-search-guide"
      }
    }) + '\n';
    
    server.stdin.write(getRequest);
  }, 500);
  
  // Get tool selection help
  setTimeout(() => {
    const helpRequest = JSON.stringify({
      jsonrpc: "2.0", 
      id: 3,
      method: "prompts/get",
      params: {
        name: "tool-selection-help",
        arguments: {
          userQuery: "Find senior Python developers with Django in SF"
        }
      }
    }) + '\n';
    
    server.stdin.write(helpRequest);
  }, 1000);
}, 2000);

// Handle responses
server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    try {
      const response = JSON.parse(line);
      
      if (response.id === 1) {
        console.log('✅ Available prompts:');
        response.result.prompts.forEach(p => {
          console.log(`   - ${p.name}: ${p.description}`);
        });
      }
      
      if (response.id === 2) {
        console.log('\n✅ Recruitment Search Guide (excerpt):');
        const content = response.result.messages[0].content.text;
        console.log(content.substring(0, 500) + '...');
      }
      
      if (response.id === 3) {
        console.log('\n✅ Tool Selection Help:');
        const content = response.result.messages[0].content.text;
        console.log(content);
        
        // Exit after all tests
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

// Timeout
setTimeout(() => {
  console.log('\n⏱️ Timeout');
  server.kill();
  process.exit(1);
}, 10000);