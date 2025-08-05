#!/usr/bin/env node

import { spawn } from 'child_process';

const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: '/Users/jms/Development/apply-codes/mcp-server'
});

console.log('🔍 Searching for AWS Architects with Python and SageMaker in Los Angeles, CA...\n');

setTimeout(() => {
  const searchRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "boolean_search",
      arguments: {
        customInstructions: "AWS Architect with Python and SageMaker experience",
        location: "Los Angeles, CA",
        platforms: ["linkedin"],
        maxResults: 10,
        includeLocationInQuery: true
      }
    }
  }) + '\n';
  
  console.log('📡 Search Parameters:');
  console.log('• Custom Instructions: "AWS Architect with Python and SageMaker experience"');
  console.log('• Location: "Los Angeles, CA"');
  console.log('• Platform: LinkedIn');
  console.log('• Max Results: 10\n');
  
  server.stdin.write(searchRequest);
}, 2000);

server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    try {
      const response = JSON.parse(line);
      
      if (response.id === 1) {
        if (response.result) {
          console.log('✅ Search completed successfully!\n');
          
          const result = response.result.content[0].text;
          const parsedResult = JSON.parse(result);
          
          console.log('🎯 Boolean Query Generated:');
          console.log(`"${parsedResult.booleanGeneration.query}"\n`);
          
          console.log('📊 Skills & Titles Extracted:');
          console.log('• Required Skills:', parsedResult.booleanGeneration.breakdown.requiredSkills.join(', '));
          console.log('• Job Titles:', parsedResult.booleanGeneration.breakdown.jobTitles.join(', ') || 'None specific');
          console.log('• Experience Level:', parsedResult.booleanGeneration.breakdown.experienceLevel || 'Any level');
          console.log();
          
          console.log(`🏆 Found ${parsedResult.searchResults.candidates.length} Candidates:\n`);
          
          parsedResult.searchResults.candidates.forEach((candidate, index) => {
            console.log(`${index + 1}. ${candidate.name}`);
            console.log(`   📋 Title: ${candidate.title}`);
            console.log(`   🏢 Company: ${candidate.company}`);
            console.log(`   📍 Location: ${candidate.location}`);
            console.log(`   🎯 Match Score: ${(candidate.matchScore * 100).toFixed(1)}%`);
            console.log(`   🔗 Profile: ${candidate.profileUrl}`);
            console.log(`   💼 Summary: ${candidate.summary.substring(0, 120)}...`);
            console.log();
          });
          
          console.log('📈 Search Summary:');
          console.log(`• Total Found: ${parsedResult.summary.candidatesFound}`);
          console.log(`• Top Match Score: ${(parsedResult.summary.topMatchScore * 100).toFixed(1)}%`);
          console.log(`• Search Time: ${parsedResult.searchResults.metadata.searchTime}`);
          
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
      // Ignore parse errors
    }
  });
});

server.stderr.on('data', (data) => {
  const message = data.toString().trim();
  if (message.includes('[boolean_search]') || message.includes('Google CSE')) {
    console.log(`[Search Engine] ${message.replace(/\[.*?\]\s*/, '')}`);
  }
});

setTimeout(() => {
  console.log('\n⏱️ Search timeout reached');
  server.kill();
  process.exit(1);
}, 30000);