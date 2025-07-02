#!/usr/bin/env node

// Simple test script to verify the MCP server starts correctly
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing Apply MCP Server...\n');

const serverPath = path.join(__dirname, 'dist', 'index.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send a test request after a short delay
setTimeout(() => {
  const testRequest = JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/list',
    id: 1
  }) + '\n';
  
  console.log('Sending test request:', testRequest);
  server.stdin.write(testRequest);
}, 1000);

server.stdout.on('data', (data) => {
  console.log('Server response:', data.toString());
});

server.stderr.on('data', (data) => {
  console.log('Server log:', data.toString());
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Kill the server after 5 seconds
setTimeout(() => {
  server.kill();
  process.exit(0);
}, 5000);