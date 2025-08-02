#!/usr/bin/env node

// Test client to verify MCP tools work correctly
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testMCPTools() {
  console.log('🧪 Testing Apply.codes MCP Server Tools...\n');

  const client = new Client({
    name: "test-client",
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

    // List available tools
    const toolsResponse = await client.request({ method: "tools/list" }, {});
    console.log(`📋 Found ${toolsResponse.tools.length} tools:`);
    toolsResponse.tools.forEach(tool => {
      console.log(`  • ${tool.name}: ${tool.description}`);
    });

    // Test a simple tool
    console.log('\n🔍 Testing generate_boolean_query tool...');
    const queryResult = await client.request({
      method: "tools/call",
      params: {
        name: "generate_boolean_query",
        arguments: {
          requiredSkills: ["JavaScript", "React"],
          platform: "linkedin"
        }
      }
    }, {});

    console.log('✅ Tool call successful!');
    console.log('Response preview:', queryResult.content[0].text.substring(0, 200) + '...');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await client.close();
    console.log('\n🔧 Test complete. You can now use Claude Desktop to interact with the server.');
  }
}

testMCPTools().catch(console.error);