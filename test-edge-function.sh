#!/bin/bash

# Test if the interview-guidance-ws edge function is accessible

SUPABASE_URL="https://kxghaajojntkqrmvsngn.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Z2hhYWpvam50a3FybXZzbmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MzY5MjgsImV4cCI6MjA1MjExMjkyOH0.4Aby8RcMgzyMwoC531TQEjcrx51NcG3nwqFrmgisU-k"

echo "🔍 Testing interview-guidance-ws edge function..."
echo ""

# Make a GET request to the edge function
response=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  "$SUPABASE_URL/functions/v1/interview-guidance-ws")

# Extract status code and body
body=$(echo "$response" | sed '$d')
status_code=$(echo "$response" | tail -n1)

echo "📡 Status Code: $status_code"
echo "📦 Response Body:"
echo "$body" | jq . 2>/dev/null || echo "$body"

if [ "$status_code" == "200" ]; then
  echo ""
  echo "✅ Edge function is accessible!"
  
  # Extract WebSocket URL if present
  ws_url=$(echo "$body" | jq -r '.websocket_url' 2>/dev/null)
  if [ "$ws_url" != "null" ] && [ -n "$ws_url" ]; then
    echo "🔌 WebSocket URL: $ws_url"
  fi
else
  echo ""
  echo "❌ Edge function returned error status: $status_code"
fi