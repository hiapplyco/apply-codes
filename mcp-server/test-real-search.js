#!/usr/bin/env node

// Test real search functionality (should show configuration error)
import { spawn } from 'child_process';

async function testRealSearch() {
  console.log('🧪 Testing real search with Google CSE configuration...\n');

  const server = spawn('node', ['dist/server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Test search candidates request
  const searchRequest = JSON.stringify({
    jsonrpc: "2.0", 
    id: 1,
    method: "tools/call",
    params: {
      name: "search_candidates",
      arguments: {
        keywords: "GCP Architect BigQuery Google Cloud Platform",
        location: "San Francisco",
        maxResults: 5
      }
    }
  }) + '\n';

  console.log('📤 Testing search_candidates with real search...');
  server.stdin.write(searchRequest);

  // Test generate_boolean_query request
  const booleanRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 2, 
    method: "tools/call",
    params: {
      name: "generate_boolean_query",
      arguments: {
        requiredSkills: ["GCP", "BigQuery", "Google Cloud Platform"],
        optionalSkills: ["Vertex AI", "Terraform"],
        jobTitles: ["GCP Architect", "Cloud Architect"],
        platform: "linkedin"
      }
    }
  }) + '\n';

  console.log('📤 Testing generate_boolean_query...');
  server.stdin.write(booleanRequest);

  // Listen for responses
  let responseCount = 0;
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        responseCount++;
        
        console.log(`📥 Response ${responseCount}:`);
        
        if (response.error) {
          console.log(`   ❌ Error: ${response.error.message}`);
          console.log(`   🔍 Error code: ${response.error.code}`);
        } else if (response.result && response.result.content) {
          try {
            const content = JSON.parse(response.result.content[0].text);
            if (content.booleanQuery) {
              console.log(`   ✅ Boolean Query Generated:`);
              console.log(`   📝 Query: ${content.booleanQuery}`);
              console.log(`   🎯 Platform: ${content.platform}`);
            } else if (content.searchQuery) {
              console.log(`   🔍 Search Result Type: ${content.searchMetadata?.realSearch ? 'REAL' : 'FAKE'}`);
              console.log(`   📊 Candidates Found: ${content.candidates?.length || 0}`);
              if (content.searchQuery.booleanQuery) {
                console.log(`   📝 Boolean Query Used: ${content.searchQuery.booleanQuery}`);
              }
            }
          } catch (e) {
            console.log(`   📄 Raw response: ${response.result.content[0].text.substring(0, 200)}...`);
          }
        }
      } catch (e) {
        console.log(`   📝 Server output: ${line}`);
      }
    }
  });

  server.stderr.on('data', (data) => {
    console.log(`🔧 ${data.toString().trim()}`);
  });

  // Close after 8 seconds
  setTimeout(() => {
    server.kill();
    console.log('\n✅ Test completed');
    console.log('\n📋 Configuration Instructions:');
    console.log('1. Get Google CSE API key: https://developers.google.com/custom-search/v1/introduction');
    console.log('2. Create Custom Search Engine: https://cse.google.com/');
    console.log('3. Set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID in .env file');
    console.log('4. Remove DEMO_MODE=true from .env to enable real searches');
  }, 8000);
}

testRealSearch().catch(console.error);