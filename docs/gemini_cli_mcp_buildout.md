# Gemini CLI MCP Tools Buildout Guide

## Overview

This comprehensive guide covers building, configuring, and deploying Model Context Protocol (MCP) servers for Gemini CLI integration. MCP servers act as bridges between Gemini CLI and external systems, enabling powerful automation workflows.

## Prerequisites

- **Gemini CLI**: Latest version installed and configured
- **Node.js**: v18+ for JavaScript MCP servers
- **Python**: 3.8+ for FastMCP implementations
- **Go**: 1.19+ for Go-based MCP servers (optional)
- **API Keys**: Google AI Studio API key for Gemini access

## Top MCP Tools & Libraries

### 1. FastMCP (Python) - Recommended
**Best for**: Rapid prototyping, custom business logic, data analysis

```bash
pip install fastmcp
```

**Key Features**:
- Type-safe decorators for tool definition
- Built-in error handling and validation
- Direct Gemini CLI integration
- Support for multimodal content (text, images, files)

**Quick Setup**:
```python
from fastmcp import FastMCP

mcp = FastMCP("My Custom Server")

@mcp.tool()
def analyze_file(filepath: str) -> str:
    """Analyze a file and return insights"""
    # Your analysis logic here
    return f"Analysis complete for {filepath}"

if __name__ == "__main__":
    mcp.run()
```

### 2. gemini-mcp-tool (JavaScript/Node)
**Best for**: Integration with existing Node.js ecosystem, web APIs

```bash
npm install -g gemini-mcp-tool
# or
npx gemini-mcp-tool
```

**Key Features**:
- Official Google-maintained tool
- Seamless npm integration
- Rich ecosystem support
- OAuth2 authentication support

### 3. Custom Go MCP Servers
**Best for**: High-performance applications, system-level integrations

```bash
go mod init my-mcp-server
go get github.com/modelcontextprotocol/go-sdk
```

## Popular Production-Ready MCP Servers

### GitHub Integration
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

**Capabilities**:
- Repository management
- Issue and PR automation
- Code review workflows
- Release management

### Firebase MCP Server
```json
{
  "mcpServers": {
    "firebase": {
      "command": "npx",
      "args": ["-y", "@google/firebase-mcp"],
      "env": {
        "FIREBASE_PROJECT_ID": "your_project_id"
      }
    }
  }
}
```

**Capabilities**:
- Firestore database operations
- Authentication management
- Cloud Functions deployment
- Storage bucket management

### Puppeteer Browser Automation
```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

**Capabilities**:
- Web scraping
- Screenshot generation
- Form automation
- UI testing

### SQLite Database
```json
{
  "mcpServers": {
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "/path/to/database.db"]
    }
  }
}
```

**Capabilities**:
- Database queries
- Schema management
- Data analysis
- Report generation

## Advanced MCP Server Configurations

### 1. Multi-Server Setup
```json
{
  "mcpServers": {
    "development": {
      "command": "uvicorn",
      "args": ["main:app", "--host", "localhost", "--port", "8000"],
      "env": {
        "ENVIRONMENT": "dev"
      }
    },
    "production": {
      "command": "node",
      "args": ["dist/server.js"],
      "env": {
        "NODE_ENV": "production",
        "PORT": "3000"
      }
    }
  }
}
```

### 2. Remote MCP Server
```json
{
  "mcpServers": {
    "remote-api": {
      "command": "node",
      "args": ["mcp-client.js"],
      "env": {
        "MCP_SERVER_URL": "https://your-api.com/mcp",
        "API_KEY": "your_api_key"
      }
    }
  }
}
```

### 3. Docker-based MCP Server
```json
{
  "mcpServers": {
    "docker-service": {
      "command": "docker",
      "args": ["run", "--rm", "-p", "8080:8080", "your-mcp-image"]
    }
  }
}
```

## Building Custom MCP Servers

### FastMCP Implementation Pattern
```python
from fastmcp import FastMCP
from typing import List, Dict
import asyncio
import aiohttp

mcp = FastMCP("Enterprise Integration Server")

@mcp.tool()
async def fetch_customer_data(customer_id: str) -> Dict:
    """Fetch customer data from CRM system"""
    async with aiohttp.ClientSession() as session:
        async with session.get(f"https://api.crm.com/customers/{customer_id}") as response:
            return await response.json()

@mcp.tool()
def analyze_sales_trends(time_period: str = "30d") -> Dict:
    """Analyze sales trends over specified time period"""
    # Your analysis logic
    return {
        "period": time_period,
        "trend": "increasing",
        "growth_rate": 15.2
    }

@mcp.resource("customer-profiles")
async def get_customer_profiles() -> List[Dict]:
    """Return available customer profiles"""
    # Return list of available customers
    return [{"id": "123", "name": "Acme Corp"}, {"id": "456", "name": "Beta Inc"}]

if __name__ == "__main__":
    mcp.run()
```

### Node.js MCP Server Pattern
```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'custom-integration-server',
  version: '1.0.0',
});

server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'process_document',
        description: 'Process and analyze documents',
        inputSchema: {
          type: 'object',
          properties: {
            file_path: { type: 'string' },
            analysis_type: { type: 'string', enum: ['summary', 'sentiment', 'keywords'] }
          },
          required: ['file_path', 'analysis_type']
        }
      }
    ]
  };
});

server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'process_document') {
    const { file_path, analysis_type } = request.params.arguments;
    // Your processing logic here
    return {
      content: [
        {
          type: 'text',
          text: `Processed ${file_path} with ${analysis_type} analysis`
        }
      ]
    };
  }
});

const transport = new StdioServerTransport();
server.connect(transport);
```

## Development Workflow

### 1. Local Development Setup
```bash
# Create development environment
mkdir my-mcp-server && cd my-mcp-server

# FastMCP setup
pip install fastmcp uvicorn
python -m fastmcp init

# Node.js setup  
npm init -y
npm install @modelcontextprotocol/sdk

# Go setup
go mod init my-mcp-server
go get github.com/modelcontextprotocol/go-sdk
```

### 2. Testing MCP Servers
```bash
# Test FastMCP server
python server.py &
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | nc localhost 8000

# Test Node.js server
node server.js &
gemini-cli test-mcp --server stdio --command "node server.js"
```

### 3. Integration Testing
```bash
# Add to Gemini CLI config
gemini config mcp add my-server python server.py

# Test integration
gemini "Use my-server to analyze this file: data.csv"
```

## Production Deployment

### 1. Docker Deployment
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Cloud Functions (Google Cloud)
```python
import functions_framework
from fastmcp import FastMCP

mcp = FastMCP("Cloud MCP Server")

@mcp.tool()
def cloud_analysis(data: str) -> str:
    return f"Analyzed: {data}"

@functions_framework.http
def mcp_handler(request):
    return mcp.handle_request(request)
```

### 3. AWS Lambda
```javascript
const { FastMCP } = require('fastmcp-js');

const mcp = new FastMCP('Lambda MCP Server');

exports.handler = async (event, context) => {
    return await mcp.handleLambdaEvent(event, context);
};
```

## Performance Optimization

### 1. Caching Strategies
```python
from fastmcp import FastMCP
import asyncio
from functools import lru_cache

mcp = FastMCP("Optimized Server")

@lru_cache(maxsize=100)
def expensive_computation(input_data: str) -> str:
    # Expensive operation with caching
    return process_data(input_data)

@mcp.tool()
async def cached_analysis(data: str) -> str:
    return expensive_computation(data)
```

### 2. Connection Pooling
```python
import aiohttp
import asyncio

class OptimizedMCPServer:
    def __init__(self):
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(limit=100, limit_per_host=30)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
```

### 3. Batch Processing
```python
@mcp.tool()
async def batch_process_files(file_paths: List[str]) -> List[Dict]:
    """Process multiple files in parallel"""
    async def process_single_file(path):
        # Process individual file
        return {"path": path, "result": "processed"}
    
    tasks = [process_single_file(path) for path in file_paths]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

## Security Best Practices

### 1. Authentication & Authorization
```python
from fastmcp import FastMCP
import jwt
from functools import wraps

def require_auth(f):
    @wraps(f)
    async def decorated_function(*args, **kwargs):
        token = get_auth_token()  # Extract from request
        try:
            jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except jwt.InvalidTokenError:
            raise AuthenticationError("Invalid token")
        return await f(*args, **kwargs)
    return decorated_function

@mcp.tool()
@require_auth
async def secure_operation(data: str) -> str:
    return f"Securely processed: {data}"
```

### 2. Input Validation
```python
from pydantic import BaseModel, validator

class ProcessRequest(BaseModel):
    file_path: str
    operation: str
    
    @validator('file_path')
    def validate_file_path(cls, v):
        if not v.endswith(('.txt', '.csv', '.json')):
            raise ValueError('Unsupported file type')
        return v
    
    @validator('operation')
    def validate_operation(cls, v):
        allowed_ops = ['analyze', 'summarize', 'extract']
        if v not in allowed_ops:
            raise ValueError(f'Operation must be one of {allowed_ops}')
        return v
```

### 3. Rate Limiting
```python
import time
from collections import defaultdict

class RateLimiter:
    def __init__(self, max_requests=100, window=3600):
        self.max_requests = max_requests
        self.window = window
        self.requests = defaultdict(list)
    
    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        client_requests = self.requests[client_id]
        
        # Remove old requests
        client_requests[:] = [req_time for req_time in client_requests 
                            if now - req_time < self.window]
        
        if len(client_requests) < self.max_requests:
            client_requests.append(now)
            return True
        return False

rate_limiter = RateLimiter()

@mcp.tool()
async def rate_limited_operation(data: str, client_id: str = "default") -> str:
    if not rate_limiter.is_allowed(client_id):
        raise Exception("Rate limit exceeded")
    return f"Processed: {data}"
```

## Monitoring & Logging

### 1. Structured Logging
```python
import logging
import json
from datetime import datetime

class StructuredLogger:
    def __init__(self, name):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter('%(message)s'))
        self.logger.addHandler(handler)
    
    def log_tool_call(self, tool_name: str, args: dict, duration: float, success: bool):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": "tool_call",
            "tool_name": tool_name,
            "args": args,
            "duration_ms": duration * 1000,
            "success": success
        }
        self.logger.info(json.dumps(log_entry))

logger = StructuredLogger("mcp_server")

@mcp.tool()
async def monitored_tool(data: str) -> str:
    start_time = time.time()
    try:
        result = f"Processed: {data}"
        logger.log_tool_call("monitored_tool", {"data": data}, 
                           time.time() - start_time, True)
        return result
    except Exception as e:
        logger.log_tool_call("monitored_tool", {"data": data}, 
                           time.time() - start_time, False)
        raise
```

### 2. Health Checks
```python
@mcp.tool()
async def health_check() -> Dict:
    """System health check"""
    import psutil
    import asyncio
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent
        },
        "uptime": time.time() - start_time
    }
```

## Command Patterns for LLM Instructions

Use these patterns to instruct LLMs to build MCP solutions:

### 1. FastMCP Server Creation
```
"Build a FastMCP Python MCP server that:
- Connects to [DATABASE/API] using [AUTHENTICATION_METHOD]
- Exposes tools for [SPECIFIC_OPERATIONS]
- Implements [VALIDATION/SECURITY_REQUIREMENTS]
- Returns structured data in JSON format
- Handles errors gracefully with meaningful messages
- Include proper type hints and documentation"
```

### 2. Integration Configuration  
```
"Create Gemini CLI configuration for MCP server that:
- Runs [LANGUAGE] server with command [COMMAND]
- Sets environment variables: [LIST_ENV_VARS]
- Configures transport as [stdio/http]
- Enables authentication with [AUTH_METHOD]
- Includes health check and monitoring endpoints"
```

### 3. Workflow Automation
```
"Design MCP workflow for Gemini CLI that:
- Chains [NUMBER] tools in sequence: [TOOL_LIST]
- Processes [INPUT_TYPE] and outputs [OUTPUT_TYPE]
- Implements error recovery with [RETRY_STRATEGY]
- Logs all operations to [LOGGING_DESTINATION]
- Triggers on [TRIGGER_CONDITIONS]"
```

## Troubleshooting Guide

### Common Issues

1. **Server Connection Failures**
   - Check port availability
   - Verify firewall settings
   - Validate environment variables

2. **Authentication Errors**
   - Confirm API keys are valid
   - Check token expiration
   - Verify scopes and permissions

3. **Performance Issues**
   - Implement connection pooling
   - Add caching layers
   - Monitor resource usage

4. **Tool Discovery Problems**
   - Validate tool schema
   - Check server registration
   - Verify MCP protocol compliance

### Debug Commands
```bash
# Test MCP server directly
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python server.py

# Validate Gemini CLI configuration
gemini config validate

# Enable debug logging
export GEMINI_CLI_DEBUG=1
gemini "test my custom tools"

# Check server health
curl http://localhost:8000/health
```

This comprehensive guide provides everything needed to build, deploy, and maintain robust MCP servers for Gemini CLI integration. Focus on starting with FastMCP for rapid development, then scale to production with proper monitoring and security practices.