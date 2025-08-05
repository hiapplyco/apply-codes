#!/bin/bash
# Post edge function deployment hook
# Runs after deploying Supabase edge functions

echo "🚀 Post-deployment checks for edge functions..."

FUNCTION_NAME=$1

if [ -z "$FUNCTION_NAME" ]; then
    echo "❌ Error: Function name not provided"
    exit 1
fi

echo "📊 Checking function status: $FUNCTION_NAME"

# Check function logs for errors
echo "📝 Fetching recent logs..."
npx supabase functions logs $FUNCTION_NAME --limit 10

# Test the function endpoint
echo "🧪 Testing function endpoint..."
SUPABASE_URL=$(grep VITE_SUPABASE_URL .env.local | cut -d '=' -f2)
ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env.local | cut -d '=' -f2)

if [ ! -z "$SUPABASE_URL" ] && [ ! -z "$ANON_KEY" ]; then
    curl -X POST \
        "$SUPABASE_URL/functions/v1/$FUNCTION_NAME" \
        -H "Authorization: Bearer $ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{"test": true}' \
        -w "\n\nHTTP Status: %{http_code}\n"
else
    echo "⚠️  Warning: Could not test endpoint (missing environment variables)"
fi

# Update documentation
echo "📚 Reminder: Update documentation if API changed"
echo "   - Update /docs/integrations/ if new integration"
echo "   - Update CLAUDE.md if new pattern introduced"
echo "   - Update MCP server if user-facing tool"

echo "✅ Post-deployment checks complete!"