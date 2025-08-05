#!/usr/bin/env node

/**
 * Test script for the apply-codes MCP server boolean_search tool
 * This demonstrates how to search for AWS Architects with SageMaker experience
 */

import { spawn } from 'child_process';

const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: '/Users/jms/Development/apply-codes/mcp-server'
});

console.log('🔍 Testing boolean_search for AWS Architects...\n');

// Wait for server to initialize
setTimeout(() => {
  // Test the boolean_search tool with AWS Architects query
  const searchRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "boolean_search",
      arguments: {
        customInstructions: "AWS Architects with SageMaker experience",
        location: "San Francisco, CA",
        platforms: ["linkedin"],
        maxResults: 5,
        includeLocationInQuery: true
      }
    }
  }) + '\n';
  
  console.log('📡 Sending search request:');
  console.log('Custom Instructions: "AWS Architects with SageMaker experience"');
  console.log('Location: "San Francisco, CA"');
  console.log('Platforms: ["linkedin"]');
  console.log('Max Results: 5\n');
  
  server.stdin.write(searchRequest);
}, 2000);

let responseBuffer = '';

server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    try {
      const response = JSON.parse(line);
      
      if (response.id === 2) {
        if (response.result) {
          console.log('✅ Search completed successfully!\n');
          console.log('📊 Results:');
          console.log(JSON.stringify(response.result, null, 2));
        } else if (response.error) {
          console.log('❌ Search failed:');
          console.log(JSON.stringify(response.error, null, 2));
        }
        
        setTimeout(() => {
          server.kill();
          process.exit(0);
        }, 1000);
      }
    } catch (e) {
      // Accumulate partial JSON responses
      responseBuffer += line;
    }
  });
});

server.stderr.on('data', (data) => {
  console.log(`[Server Debug] ${data.toString().trim()}`);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⏱️ Test timeout reached');
  server.kill();
  process.exit(1);
}, 30000);