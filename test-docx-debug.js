// Test script to debug .docx file upload to parse-document function
const SUPABASE_URL = 'https://kxghaajojntkqrmvsngn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Z2hhYWpvam50a3FybXZzbmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MzYxMjksImV4cCI6MjA0ODUxMjEyOX0.nOJbfzG3RhDZZXBXzQcj5MNRfLZSNZsQcBPjZqIjHRs';

async function createMinimalDocxFile() {
  // Create a minimal .docx file content (simplified ZIP structure)
  const minimalDocxContent = new Uint8Array([
    0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00, // ZIP header
    0x00, 0x00, 0x21, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // More ZIP data
    0x00, 0x00, 0x0C, 0x00, 0x00, 0x00, 0x5B, 0x43, 0x6F, 0x6E, // [Content_Types].xml
    0x74, 0x65, 0x6E, 0x74, 0x5F, 0x54, 0x79, 0x70, 0x65, 0x73, 
    0x5D, 0x2E, 0x78, 0x6D, 0x6C, 0x50, 0x4B, 0x01, 0x02, 0x14, // End of ZIP
    0x00, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x21,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0C,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x5B, 0x43, 0x6F,
    0x6E, 0x74, 0x65, 0x6E, 0x74, 0x5F, 0x54, 0x79, 0x70, 0x65,
    0x73, 0x5D, 0x2E, 0x78, 0x6D, 0x6C, 0x50, 0x4B, 0x05, 0x06,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x3A, 0x00,
    0x00, 0x00, 0x15, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  
  return new File([minimalDocxContent], 'test-document.docx', {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

async function testDocxUpload() {
  console.log('🔍 Testing .docx file upload to parse-document function...');
  
  const docxFile = await createMinimalDocxFile();
  
  const formData = new FormData();
  formData.append('file', docxFile);
  formData.append('userId', 'test-user-id');
  
  try {
    console.log('📤 Sending request to parse-document function...');
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
    console.log('📊 Response headers:', [...response.headers.entries()]);
    
    const responseText = await response.text();
    console.log('📊 Response body:', responseText);
    
    if (!response.ok) {
      console.error('❌ Request failed with status:', response.status);
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Error details:', errorData);
      } catch (e) {
        console.error('❌ Raw error response:', responseText);
      }
    } else {
      console.log('✅ Request successful!');
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Response data:', data);
      } catch (e) {
        console.log('✅ Raw response:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Also test with a simpler approach - create a basic text file with .docx extension
async function testSimpleDocxFile() {
  console.log('\n🔍 Testing with simple text file as .docx...');
  
  const simpleContent = "This is a test document with some sample text.";
  const simpleFile = new File([simpleContent], 'simple-test.docx', {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  
  const formData = new FormData();
  formData.append('file', simpleFile);
  formData.append('userId', 'test-user-id');
  
  try {
    console.log('📤 Sending simple .docx file...');
    console.log('File details:', {
      name: simpleFile.name,
      type: simpleFile.type,
      size: simpleFile.size
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
    console.log('📊 Response body:', responseText);
    
    if (!response.ok) {
      console.error('❌ Simple docx test failed with status:', response.status);
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Error details:', errorData);
      } catch (e) {
        console.error('❌ Raw error response:', responseText);
      }
    } else {
      console.log('✅ Simple docx test successful!');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Test with text file for comparison
async function testTextFile() {
  console.log('\n🔍 Testing with text file for comparison...');
  
  const textContent = "This is a test document with some sample text.";
  const textFile = new File([textContent], 'test.txt', {
    type: 'text/plain'
  });
  
  const formData = new FormData();
  formData.append('file', textFile);
  formData.append('userId', 'test-user-id');
  
  try {
    console.log('📤 Sending text file...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: formData
    });
    
    console.log('📊 Text file response status:', response.status);
    const responseText = await response.text();
    console.log('📊 Text file response:', responseText);
    
    if (!response.ok) {
      console.error('❌ Text file test failed');
    } else {
      console.log('✅ Text file test successful!');
    }
    
  } catch (error) {
    console.error('❌ Text file network error:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive .docx upload debugging...\n');
  
  await testTextFile();
  await testSimpleDocxFile();
  await testDocxUpload();
  
  console.log('\n🏁 All tests completed!');
}

runAllTests().catch(console.error);