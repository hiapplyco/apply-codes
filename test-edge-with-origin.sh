#!/bin/bash

# Test edge function with origin header

SUPABASE_URL="https://kxghaajojntkqrmvsngn.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Z2hhYWpvam50a3FybXZzbmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MzY5MjgsImV4cCI6MjA1MjExMjkyOH0.4Aby8RcMgzyMwoC531TQEjcrx51NcG3nwqFrmgisU-k"

echo "🔍 Testing interview-guidance-ws edge function with origin header..."
echo ""

# Make a GET request with origin header
response=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  -H "Origin: $SUPABASE_URL" \
  "$SUPABASE_URL/functions/v1/interview-guidance-ws")

# Extract status code and body
body=$(echo "$response" | sed '$d')
status_code=$(echo "$response" | tail -n1)

echo "📡 Status Code: $status_code"
echo "📦 Response Body:"
echo "$body" | jq . 2>/dev/null || echo "$body"