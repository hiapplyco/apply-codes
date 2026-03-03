'use strict';

const path = require('path');
const { logger } = require('firebase-functions/v2');

const DIST_DIR = path.join(__dirname, '..', 'mcp-server-dist');

let _cachedTools = null;
let _cachedDeclarations = null;

function stripAdditionalProperties(schema) {
  if (!schema || typeof schema !== 'object') return schema;
  const cleaned = { ...schema };
  delete cleaned.additionalProperties;
  delete cleaned.$schema;
  if (cleaned.properties) {
    const props = {};
    for (const key of Object.keys(cleaned.properties)) {
      props[key] = stripAdditionalProperties(cleaned.properties[key]);
    }
    cleaned.properties = props;
  }
  if (cleaned.items) {
    cleaned.items = stripAdditionalProperties(cleaned.items);
  }
  return cleaned;
}

async function loadMCPTools() {
  if (_cachedTools && _cachedDeclarations) {
    return { tools: _cachedTools, functionDeclarations: _cachedDeclarations };
  }

  logger.info('[tool-bundler] Loading MCP tools from dist...');

  const [
    { sourcingTools },
    { documentTools },
    { orchestrationTools },
    { interviewTools },
    { booleanSearchTool },
  ] = await Promise.all([
    import(path.join(DIST_DIR, 'controllers', 'sourcing-tools.js')),
    import(path.join(DIST_DIR, 'controllers', 'document-tools.js')),
    import(path.join(DIST_DIR, 'controllers', 'orchestration-tools.js')),
    import(path.join(DIST_DIR, 'controllers', 'interview-tools.js')),
    import(path.join(DIST_DIR, 'controllers', 'boolean-search-tool.js')),
  ]);

  const allToolArrays = [
    sourcingTools,
    documentTools,
    orchestrationTools,
    interviewTools,
  ];

  const tools = new Map();
  const seen = new Set();

  for (const toolArray of allToolArrays) {
    for (const tool of toolArray) {
      const def = tool.getDefinition();
      if (seen.has(def.name)) continue;
      seen.add(def.name);
      tools.set(def.name, tool);
    }
  }

  if (!tools.has('boolean_search') && booleanSearchTool) {
    const def = booleanSearchTool.getDefinition();
    tools.set(def.name, booleanSearchTool);
  }

  const functionDeclarations = [];
  for (const [name, tool] of tools) {
    const def = tool.getDefinition();
    functionDeclarations.push({
      name: def.name,
      description: def.description,
      parameters: stripAdditionalProperties(def.inputSchema),
    });
  }

  logger.info(`[tool-bundler] Loaded ${tools.size} MCP tools`);

  _cachedTools = tools;
  _cachedDeclarations = functionDeclarations;

  return { tools, functionDeclarations };
}

async function executeTool(tools, toolName, args) {
  const tool = tools.get(toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  const result = await tool.execute({ name: toolName, arguments: args });
  return result;
}

module.exports = {
  loadMCPTools,
  executeTool,
  stripAdditionalProperties,
};
