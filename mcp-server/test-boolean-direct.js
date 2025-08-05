#!/usr/bin/env node

// Direct test of boolean search
import { spawn } from 'child_process';

const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

console.log('🎯 Testing boolean search (web app flow)...\n');

// Wait for server to start
setTimeout(() => {
  // List tools first to verify
  const listRequest = JSON.stringify({
    jsonrpc: "2.0", 
    id: 1,
    method: "tools/list"
  }) + '\n';
  
  server.stdin.write(listRequest);
  
  // Then send boolean search request
  setTimeout(() => {
    const searchRequest = JSON.stringify({
      jsonrpc: "2.0", 
      id: 2,
      method: "tools/call",
      params: {
        name: "boolean_search",
        arguments: {
          customInstructions: "GCP Architect with BigQuery experience",
          location: "San Francisco",
          platforms: ["linkedin"],
          maxResults: 5
        }
      }
    }) + '\n';
    
    console.log('📤 Sending boolean search request...');
    server.stdin.write(searchRequest);
  }, 1000);
}, 2000);

// Collect all responses
let buffer = '';

server.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  
  // Process complete lines
  lines.slice(0, -1).forEach(line => {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        
        if (response.id === 1 && response.result) {
          const tools = response.result.tools;
          const booleanSearch = tools.find(t => t.name === 'boolean_search');
          if (booleanSearch) {
            console.log('✅ boolean_search tool found in tool list');
          } else {
            console.log('❌ boolean_search tool NOT found. Available tools:');
            tools.forEach(t => console.log(`   - ${t.name}`));
          }
        }
        
        if (response.id === 2) {
          if (response.error) {
            console.log(`\n❌ Error: ${response.error.message}`);
            process.exit(1);
          } else if (response.result) {
            const content = JSON.parse(response.result.content[0].text);
            
            console.log('\n✅ Boolean Search Results:');
            console.log('\nStep 1 - Boolean Query:');
            console.log(`  Query: ${content.booleanGeneration.query}`);
            
            console.log('\nStep 2 - Search Results:');
            console.log(`  Found ${content.searchResults.candidates.length} candidates`);
            
            content.searchResults.candidates.slice(0, 3).forEach((c, i) => {
              console.log(`\n  ${i+1}. ${c.name}`);
              console.log(`     ${c.title} at ${c.company}`);
              console.log(`     📍 ${c.location}`);
              console.log(`     🎯 Match: ${(c.matchScore * 100).toFixed(0)}%`);
            });
            
            process.exit(0);
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  });
  
  // Keep last incomplete line
  buffer = lines[lines.length - 1];
});

server.stderr.on('data', (data) => {
  const msg = data.toString().trim();
  if (msg.includes('🎯') || msg.includes('✅') || msg.includes('tools')) {
    console.error(`[DEBUG] ${msg}`);
  }
});

// Timeout
setTimeout(() => {
  console.log('\n⏱️ Timeout');
  server.kill();
  process.exit(1);
}, 10000);