#!/usr/bin/env node

// Quick test for the improved search functionality
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testSearchRelevance() {
  console.log('🔍 Testing improved search relevance...\n');

  const client = new Client({
    name: "search-test-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  const transport = new StdioClientTransport({
    command: "node",
    args: ["./dist/server.js"]
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server');

    // Test 1: GCP Vertex AI search (should return highly relevant candidates)
    console.log('\n🧪 Test 1: GCP Vertex AI Architect search');
    const gcpResult = await client.request({
      method: "tools/call",
      params: {
        name: "search_candidates",
        arguments: {
          keywords: "GCP Architect Vertex AI Gemini Google Cloud Platform",
          location: "San Francisco",
          maxResults: 5
        }
      }
    }, {});

    console.log('📊 GCP Search Results:');
    const gcpCandidates = JSON.parse(gcpResult.content[0].text).candidates;
    gcpCandidates.forEach((candidate, i) => {
      console.log(`  ${i+1}. ${candidate.name} (${candidate.title}) - Score: ${candidate.matchScore}`);
      console.log(`     Skills: ${candidate.skills.join(', ')}`);
      console.log(`     Company: ${candidate.company}`);
    });

    // Test 2: JavaScript React search (should return frontend developers)
    console.log('\n🧪 Test 2: JavaScript React Developer search');
    const jsResult = await client.request({
      method: "tools/call",
      params: {
        name: "search_candidates",
        arguments: {
          keywords: "JavaScript React Frontend Developer",
          location: "San Francisco",
          maxResults: 3
        }
      }
    }, {});

    console.log('📊 JavaScript Search Results:');
    const jsCandidates = JSON.parse(jsResult.content[0].text).candidates;
    jsCandidates.forEach((candidate, i) => {
      console.log(`  ${i+1}. ${candidate.name} (${candidate.title}) - Score: ${candidate.matchScore}`);
      console.log(`     Skills: ${candidate.skills.join(', ')}`);
    });

    console.log('\n✅ Search relevance test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await client.close();
  }
}

testSearchRelevance().catch(console.error);