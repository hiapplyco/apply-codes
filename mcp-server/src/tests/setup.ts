// Jest setup file for MCP server tests

// Mock console methods to avoid noise in test output
global.console = {
  ...console,
  // Uncomment the line below to suppress console.log in tests
  // log: jest.fn(),
  error: console.error, // Keep errors visible
  warn: console.warn,   // Keep warnings visible
};

// Mock external dependencies that aren't available in test environment
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn(),
    close: jest.fn(),
    onerror: null,
  })),
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: 'CallToolRequestSchema',
  ListToolsRequestSchema: 'ListToolsRequestSchema',
  ToolSchema: 'ToolSchema',
}));

// Global test timeout
jest.setTimeout(10000);

export {};