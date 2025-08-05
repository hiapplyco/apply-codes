// Test Gemini API directly to isolate the issue
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

async function testGeminiDirect() {
  console.log('🧪 Testing Gemini API directly...');
  
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error('❌ GEMINI_API_KEY not found');
    return;
  }
  
  console.log('✅ API Key found, length:', geminiApiKey.length);
  
  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = 'Generate a simple LinkedIn boolean search for "Data Scientist with Python experience". Return only the boolean string.';
    
    console.log('📤 Sending request to Gemini...');
    const startTime = Date.now();
    
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000)
      )
    ]);
    
    const endTime = Date.now();
    console.log(`⏱️ Request completed in ${endTime - startTime}ms`);
    
    const response = result.response.text();
    console.log('✅ Response received:');
    console.log(response);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Timeout')) {
      console.log('🔍 This suggests Gemini API is slow/unresponsive');
    }
  }
}

testGeminiDirect();