#!/bin/bash

# Apply.codes MCP Server Startup Script
# This script builds and starts the MCP server for testing

cd "$(dirname "$0")"

echo "🏗️  Building Apply.codes MCP Server..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check for TypeScript errors."
    exit 1
fi

echo "🚀 Starting Apply.codes MCP Server..."
echo "📋 Available tools:"
echo "   🔍 Candidate Sourcing (4 tools)"
echo "     • generate_boolean_query"
echo "     • search_candidates" 
echo "     • analyze_job_requirements"
echo "     • get_market_intelligence"
echo "   📄 Document Processing (3 tools)"
echo "     • parse_resume"
echo "     • enhance_job_description"
echo "     • compare_documents"
echo "   🤖 AI Orchestration (3 tools)"
echo "     • execute_recruitment_workflow"
echo "     • create_recruitment_plan"
echo "     • get_orchestrator_status"
echo "   💼 Interview Tools (2 tools)"
echo "     • generate_interview_questions"
echo "     • analyze_interview_feedback"
echo ""
echo "💡 To test: Restart Claude Desktop and look for 'apply-recruitment' server"
echo "   Try asking: 'Search for senior React developers' or 'Generate interview questions'"
echo ""

node dist/server.js