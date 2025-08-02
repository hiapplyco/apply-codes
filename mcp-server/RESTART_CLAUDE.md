# 🔄 How to Restart Claude Desktop & Test MCP Server

## Step 1: Completely Quit Claude Desktop
1. **Right-click** on Claude Desktop in your dock
2. Select **"Quit"** (don't just minimize the window)
3. Wait 5 seconds to ensure it's fully closed

## Step 2: Restart Claude Desktop
1. **Open Claude Desktop** from Applications or dock
2. Wait for it to fully load (you should see the chat interface)

## Step 3: Verify MCP Server Connection
Look for these indicators that the server is working:
- **No error messages** during startup
- **Server appears in tools list** (if Claude shows available servers)
- **Tools respond to queries** (test with examples below)

## Step 4: Test with Example Queries

Try these queries to test different tool categories:

### 🔍 Candidate Sourcing
```
"Generate a Boolean search query for senior React developers in San Francisco"
```

### 📄 Document Processing
```
"I have a resume for John Smith, a software engineer with 5 years experience in JavaScript and React. Can you parse this information and extract the key details?"
```

### 🤖 AI Orchestration
```
"Create a recruitment plan for hiring 2 senior software engineers within 8 weeks"
```

### 💼 Interview Tools
```
"Generate technical interview questions for a senior JavaScript developer role"
```

## 🚨 Troubleshooting

If tools don't work:

1. **Check the config file**:
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```
   Should show `apply-recruitment` server

2. **Test server manually**:
   ```bash
   cd /Users/jms/Development/apply-codes/mcp-server
   ./start-server.sh
   ```

3. **Check for errors**:
   - Look in Claude Desktop developer console (if available)
   - Check server logs at `/Users/jms/Development/apply-codes/docs/mcp-server-apply-recruitment.log`

4. **Rebuild if needed**:
   ```bash
   cd /Users/jms/Development/apply-codes/mcp-server
   npm run build
   ```

## ✅ Success Indicators

You'll know it's working when:
- ✅ Claude Desktop starts without errors
- ✅ You can ask recruitment-related questions
- ✅ Claude responds with structured data about candidates, job requirements, etc.
- ✅ Tools return JSON-formatted results

## 🎯 Ready to Use!

Once working, you can use natural language to:
- Search for candidates across platforms
- Parse and analyze resumes
- Generate interview questions
- Create recruitment strategies
- Execute complete hiring workflows

The Apply.codes platform is now your AI-powered recruitment assistant! 🚀