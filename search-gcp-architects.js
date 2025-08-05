#!/usr/bin/env node

import { spawn } from 'child_process';

async function searchGCPArchitects() {
  console.log('🔍 Searching for GCP Architects with BigQuery experience in San Francisco...\n');

  const server = spawn('node', ['/Users/jms/Development/apply-codes/mcp-server/dist/server.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: '/Users/jms/Development/apply-codes'
  });

  // Search request for GCP Architects
  const searchRequest = JSON.stringify({
    jsonrpc: "2.0", 
    id: 1,
    method: "tools/call",
    params: {
      name: "search_candidates",
      arguments: {
        keywords: "GCP Architect BigQuery Data Engineering Google Cloud Platform San Francisco",
        location: "San Francisco Bay Area",
        platforms: ["linkedin"],
        maxResults: 10,
        experienceLevel: "senior"
      }
    }
  }) + '\n';

  // Send the request
  setTimeout(() => {
    server.stdin.write(searchRequest);
  }, 2000);

  // Listen for responses
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        
        if (response.error) {
          console.log(`❌ Error: ${response.error.message}`);
        } else if (response.result && response.result.content) {
          try {
            const content = JSON.parse(response.result.content[0].text);
            if (content.candidates) {
              console.log(`✅ Found ${content.candidates.length} GCP Architects:\n`);
              
              content.candidates.forEach((candidate, index) => {
                console.log(`\n${index + 1}. ${candidate.name}`);
                console.log(`   📋 ${candidate.title} at ${candidate.company}`);
                console.log(`   📍 ${candidate.location}`);
                console.log(`   🔗 ${candidate.profileUrl}`);
                console.log(`   💼 ${candidate.summary.substring(0, 150)}...`);
                console.log(`   🎯 Match Score: ${(candidate.matchScore * 100).toFixed(0)}%`);
              });
              
              console.log(`\n📊 Search Details:`);
              console.log(`   Query: ${content.searchQuery.booleanQuery}`);
              console.log(`   Platform: LinkedIn`);
              console.log(`   Location: ${content.searchQuery.location}`);
              
              // Close the server after displaying results
              setTimeout(() => {
                server.kill();
                process.exit(0);
              }, 1000);
            }
          } catch (e) {
            // Ignore parsing errors for non-result messages
          }
        }
      } catch (e) {
        // Ignore non-JSON output
      }
    }
  });

  server.stderr.on('data', (data) => {
    const output = data.toString().trim();
    console.log(`🔧 ${output}`);
  });

  // Timeout after 30 seconds
  setTimeout(() => {
    console.log('\n⏱️  Search timed out');
    server.kill();
    process.exit(1);
  }, 30000);
}

searchGCPArchitects().catch(console.error);