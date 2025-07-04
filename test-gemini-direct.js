// Test script to debug Gemini AI SDK integration directly
const SUPABASE_URL = 'https://kxghaajojntkqrmvsngn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Z2hhYWpvam50a3FybXZzbmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MzYxMjksImV4cCI6MjA0ODUxMjEyOX0.nOJbfzG3RhDZZXBXzQcBPjZsQcBPjZqIjHRs';

// Try to use the newer base64 inline approach directly
async function testGeminiDirectBase64() {
  console.log('🔍 Testing Gemini direct base64 approach...');
  
  // Create a simple DOCX-like content
  const simpleContent = "This is a test document with some sample text.";
  const arrayBuffer = new TextEncoder().encode(simpleContent).buffer;
  
  // Convert to base64
  const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  
  const requestBody = {
    contents: [
      {
        parts: [
          { text: 'Extract all text from this document, preserving the original structure, formatting, and any relevant details.' },
          {
            inline_data: {
              mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              data: base64Data
            }
          }
        ]
      }
    ]
  };
  
  try {
    console.log('📤 Sending direct Gemini API request...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=your-api-key-here`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('📊 Response status:', response.status);
    const responseText = await response.text();
    console.log('📊 Response:', responseText);
    
  } catch (error) {
    console.error('❌ Direct Gemini API error:', error);
  }
}

// Test with a more targeted edge function call
async function testWithMinimalPayload() {
  console.log('\n🔍 Testing with minimal payload...');
  
  // Create the simplest possible valid text content
  const textContent = "Hello World";
  const textFile = new File([textContent], 'test.docx', {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  
  const formData = new FormData();
  formData.append('file', textFile);
  formData.append('userId', 'test-user');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: formData
    });
    
    console.log('📊 Response status:', response.status);
    const responseText = await response.text();
    console.log('📊 Response:', responseText);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test by explicitly checking if the issue is with the Google AI SDK
async function testSkipGoogleAI() {
  console.log('\n🔍 Testing bypass Google AI processing...');
  
  // Test what happens if we modify the logic to skip Google AI entirely
  const testFile = new File(['test content'], 'test.docx', {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  
  // First, let's see what would happen with a .txt file  
  const txtFile = new File(['test content'], 'test.txt', {
    type: 'text/plain'
  });
  
  const formData = new FormData();
  formData.append('file', txtFile);
  formData.append('userId', 'test-user');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: formData
    });
    
    console.log('📊 TXT Response status:', response.status);
    const responseText = await response.text();
    console.log('📊 TXT Response:', responseText);
    
  } catch (error) {
    console.error('❌ TXT Error:', error);
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting targeted Gemini AI debugging...\n');
  
  await testSkipGoogleAI();
  await testWithMinimalPayload();
  // await testGeminiDirectBase64(); // Skip this as it needs API key
  
  console.log('\n🏁 Tests completed!');
}

runTests().catch(console.error);