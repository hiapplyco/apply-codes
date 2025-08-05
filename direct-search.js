#!/usr/bin/env node

import { ApplyMCPServer } from './mcp-server/dist/server.js';

async function searchDirectly() {
  console.log('🔍 Direct search for GCP Architects...\n');
  
  // Create server instance
  const server = new ApplyMCPServer();
  
  // Get tool handler
  const tools = Array.from(server.tools.entries());
  const searchTool = tools.find(([name]) => name === 'search_candidates')?.[1];
  
  if (!searchTool) {
    console.error('Search tool not found');
    return;
  }
  
  try {
    // Execute search
    const result = await searchTool.execute({
      name: 'search_candidates',
      arguments: {
        keywords: "GCP Architect BigQuery Data Engineering Google Cloud Platform",
        location: "San Francisco Bay Area",
        platforms: ["linkedin"],
        maxResults: 10,
        experienceLevel: "senior"
      }
    });
    
    const content = JSON.parse(result.content[0].text);
    
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
    
  } catch (error) {
    console.error('Search failed:', error.message);
  }
}

searchDirectly().catch(console.error);