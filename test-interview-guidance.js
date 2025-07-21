// Test script for Interview Guidance WebSocket
// Usage: node test-interview-guidance.js

const WebSocket = require('ws');
const https = require('https');

// Configuration
const SUPABASE_URL = 'https://kxghaajojntkqrmvsngn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Z2hhYWpvam50a3FybXZzbmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MzY5MjgsImV4cCI6MjA1MjExMjkyOH0.4Aby8RcMgzyMwoC531TQEjcrx51NcG3nwqFrmgisU-k';

async function getWebSocketUrl() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'kxghaajojntkqrmvsngn.supabase.co',
      path: '/functions/v1/interview-guidance-ws',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('✅ Edge function responded:', parsed);
          resolve(parsed.websocket_url);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testWebSocket() {
  console.log('🔍 Testing Interview Guidance WebSocket...\n');
  
  try {
    // Step 1: Get WebSocket URL
    console.log('1️⃣ Getting WebSocket URL from edge function...');
    const wsUrl = await getWebSocketUrl();
    console.log(`   WebSocket URL: ${wsUrl}\n`);

    // Step 2: Connect to WebSocket
    console.log('2️⃣ Connecting to WebSocket...');
    const ws = new WebSocket(wsUrl, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });

    ws.on('open', () => {
      console.log('✅ WebSocket connected!\n');

      // Step 3: Send context update
      console.log('3️⃣ Sending context update...');
      const contextUpdate = {
        type: 'context_update',
        context: {
          sessionId: 'test-session-123',
          meetingId: 'test-meeting-456',
          jobRole: 'Senior Software Engineer',
          competencies: [
            {
              id: 'tech-1',
              name: 'System Design',
              description: 'Ability to design scalable systems',
              category: 'technical',
              required: true,
              coverageLevel: 0
            },
            {
              id: 'behav-1',
              name: 'Leadership',
              description: 'Demonstrated leadership skills',
              category: 'behavioral',
              required: true,
              coverageLevel: 0
            }
          ],
          stage: 'intro'
        }
      };
      ws.send(JSON.stringify(contextUpdate));
      console.log('   Sent context update\n');

      // Step 4: Send transcript
      setTimeout(() => {
        console.log('4️⃣ Sending test transcript...');
        const transcript = {
          type: 'transcript',
          speaker: 'candidate',
          text: 'In my previous role, I designed a distributed system that handled 10 million requests per day. I led a team of 5 engineers to implement microservices architecture.',
          timestamp: new Date().toISOString()
        };
        ws.send(JSON.stringify(transcript));
        console.log('   Sent transcript\n');
      }, 1000);

      // Step 5: Request guidance
      setTimeout(() => {
        console.log('5️⃣ Requesting guidance...');
        const guidanceRequest = {
          type: 'guidance_request',
          urgency: 'high'
        };
        ws.send(JSON.stringify(guidanceRequest));
        console.log('   Sent guidance request\n');
      }, 2000);
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', JSON.stringify(message, null, 2));
      
      if (message.type === 'tip') {
        console.log('\n💡 Got interview tip:');
        console.log(`   Priority: ${message.tip.priority}`);
        console.log(`   Message: ${message.tip.message}`);
        if (message.tip.suggestedQuestion) {
          console.log(`   Suggested Question: ${message.tip.suggestedQuestion}`);
        }
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
    });

    ws.on('close', (code, reason) => {
      console.log(`\n🔒 WebSocket closed. Code: ${code}, Reason: ${reason}`);
      process.exit(0);
    });

    // Keep the script running
    setTimeout(() => {
      console.log('\n✅ Test completed. Closing connection...');
      ws.close();
    }, 10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testWebSocket();