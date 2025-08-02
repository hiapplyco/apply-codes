#!/usr/bin/env node

// Simple test to check server responses without SDK parsing
import { spawn } from 'child_process';

async function testServerDirectly() {
  console.log('🧪 Testing server directly...\n');

  const server = spawn('node', ['dist/server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Send a list tools request first
  const listToolsRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  }) + '\n';

  console.log('📤 Sending tools/list request...');
  server.stdin.write(listToolsRequest);

  // Send a search candidates request
  const searchRequest = JSON.stringify({
    jsonrpc: "2.0", 
    id: 2,
    method: "tools/call",
    params: {
      name: "search_candidates",
      arguments: {
        keywords: "GCP Architect Vertex AI Gemini",
        location: "San Francisco",
        maxResults: 3
      }
    }
  }) + '\n';

  console.log('📤 Sending search_candidates request...');
  server.stdin.write(searchRequest);

  // Listen for responses
  let responseCount = 0;
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        responseCount++;
        
        console.log(`📥 Response ${responseCount}:`);
        
        if (response.result && response.result.tools) {
          console.log(`   Found ${response.result.tools.length} tools`);
        } else if (response.result && response.result.content) {
          console.log(`   Tool call result received`);
          try {
            const content = JSON.parse(response.result.content[0].text);
            if (content.candidates) {
              console.log(`   📊 Found ${content.candidates.length} candidates:`);
              content.candidates.forEach((candidate, i) => {
                console.log(`     ${i+1}. ${candidate.name} (${candidate.title}) - Score: ${candidate.matchScore}`);
                console.log(`        Skills: ${candidate.skills.join(', ')}`);
              });
            }
          } catch (e) {
            console.log(`   Raw content: ${response.result.content[0].text.substring(0, 100)}...`);
          }
        } else {
          console.log(`   Raw response:`, JSON.stringify(response, null, 2));
        }
      } catch (e) {
        console.log(`   Non-JSON output: ${line}`);
      }
    }
  });

  server.stderr.on('data', (data) => {
    console.log(`🔧 Server log: ${data.toString().trim()}`);
  });

  // Close after 10 seconds
  setTimeout(() => {
    server.kill();
    console.log('\n✅ Test completed');
  }, 10000);
}

testServerDirectly().catch(console.error);