// Test with real DOCX files
import fs from 'fs';

const SUPABASE_URL = 'https://kxghaajojntkqrmvsngn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Z2hhYWpvam50a3FybXZzbmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MzYxMjksImV4cCI6MjA0ODUxMjEyOX0.nOJbfzG3RhDZZXBXzQcBPjZsQcBPjZqIjHRs';

async function testRealMinimalDocx() {
  console.log('🔍 Testing with minimal DOCX file...');
  
  try {
    const docxData = fs.readFileSync('minimal-test.docx');
    const docxFile = new File([docxData], 'minimal-test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    
    const formData = new FormData();
    formData.append('file', docxFile);
    formData.append('userId', 'test-user');
    
    console.log('📤 Sending minimal DOCX file...');
    console.log('File details:', {
      name: docxFile.name,
      type: docxFile.type,
      size: docxFile.size
    });
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: formData
    });
    
    console.log('📊 Response status:', response.status);
    const responseText = await response.text();
    console.log('📊 Response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
    
    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Error details:', errorData);
      } catch (e) {
        console.error('❌ Raw error:', responseText);
      }
    } else {
      console.log('✅ Minimal DOCX test successful!');
    }
    
  } catch (error) {
    console.error('❌ Error with minimal DOCX:', error);
  }
}

async function testTextAsDocx() {
  console.log('\n🔍 Testing with text file as .docx...');
  
  try {
    const textData = fs.readFileSync('text-as-docx.docx');
    const textFile = new File([textData], 'text-as-docx.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    
    const formData = new FormData();
    formData.append('file', textFile);
    formData.append('userId', 'test-user');
    
    console.log('📤 Sending text-as-docx file...');
    console.log('File details:', {
      name: textFile.name,
      type: textFile.type,
      size: textFile.size
    });
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: formData
    });
    
    console.log('📊 Response status:', response.status);
    const responseText = await response.text();
    console.log('📊 Response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
    
    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Error details:', errorData);
      } catch (e) {
        console.error('❌ Raw error:', responseText);
      }
    } else {
      console.log('✅ Text-as-DOCX test successful!');
    }
    
  } catch (error) {
    console.error('❌ Error with text-as-docx:', error);
  }
}

// Test if we can process it as a different file type
async function testAsPlainText() {
  console.log('\n🔍 Testing DOCX content as plain text file...');
  
  try {
    const textData = fs.readFileSync('text-as-docx.docx');
    const textFile = new File([textData], 'test.txt', {
      type: 'text/plain'
    });
    
    const formData = new FormData();
    formData.append('file', textFile);
    formData.append('userId', 'test-user');
    
    console.log('📤 Sending as plain text file...');
    
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
    
    if (response.ok) {
      console.log('✅ Plain text test successful!');
    }
    
  } catch (error) {
    console.error('❌ Error with plain text:', error);
  }
}

async function runAllTests() {
  console.log('🚀 Testing with real DOCX files...\n');
  
  // Check if files exist
  if (!fs.existsSync('minimal-test.docx') || !fs.existsSync('text-as-docx.docx')) {
    console.log('📋 Creating test files first...');
    const { execSync } = await import('child_process');
    execSync('node create-real-docx.js');
  }
  
  await testAsPlainText();
  await testTextAsDocx();
  await testRealMinimalDocx();
  
  console.log('\n🏁 All real DOCX tests completed!');
}

runAllTests().catch(console.error);