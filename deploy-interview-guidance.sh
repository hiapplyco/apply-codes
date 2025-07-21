#!/bin/bash

# Deploy Interview Guidance Edge Function
# This script deploys the interview-guidance-ws edge function to Supabase

echo "🚀 Deploying Interview Guidance WebSocket Edge Function..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "   Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/functions/interview-guidance-ws/index.ts" ]; then
    echo "❌ Edge function not found at expected path."
    echo "   Please run this script from the project root directory."
    exit 1
fi

# Check if GEMINI_API_KEY is set
if [ -z "$VITE_GEMINI_API_KEY" ]; then
    echo "⚠️  VITE_GEMINI_API_KEY not found in environment."
    echo "   The edge function needs GEMINI_API_KEY to work properly."
    echo "   Loading from .env.local..."
    
    if [ -f ".env.local" ]; then
        export $(grep VITE_GEMINI_API_KEY .env.local | xargs)
        GEMINI_API_KEY="${VITE_GEMINI_API_KEY#VITE_}"
    else
        echo "❌ .env.local file not found."
        exit 1
    fi
else
    GEMINI_API_KEY="${VITE_GEMINI_API_KEY#VITE_}"
fi

echo "✓ Found GEMINI_API_KEY"
echo ""

# Deploy the function
echo "📦 Deploying edge function..."
supabase functions deploy interview-guidance-ws \
  --no-verify-jwt

# Set the secret
echo ""
echo "🔐 Setting GEMINI_API_KEY secret..."
echo "$GEMINI_API_KEY" | supabase secrets set GEMINI_API_KEY

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Test the WebSocket connection: node test-interview-guidance.js"
echo "   2. Check the function logs: supabase functions logs interview-guidance-ws"
echo "   3. Use the interview guidance feature in your meetings"
echo ""
echo "🔍 Troubleshooting:"
echo "   - If WebSocket fails, check CORS settings in the edge function"
echo "   - Ensure Daily.co transcription is enabled for interview meetings"
echo "   - Check browser console for any client-side errors"