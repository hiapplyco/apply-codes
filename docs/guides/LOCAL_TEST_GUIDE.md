# Local Testing Guide - Interview Room Feature

## 🚀 Quick Start

The development server is now running at: **http://localhost:8080**

## 📋 Testing Steps

### 1. Access the Interview Room
Navigate to: http://localhost:8080/interview-room

### 2. Test File Upload Feature
1. Click on the **paperclip icon** or drag and drop files
2. Supported formats: PDF, DOC, DOCX, TXT, RTF, ODT
3. The file will be processed by the Gemini AI edge function

### 3. Test Interview Types
- Try different interview types (12 options available)
- Each has a tooltip explaining its purpose
- Select one to proceed with interview preparation

### 4. Test the Workflow
1. **Setup Tab**: Upload files and select interview type
2. **Live Interview Tab**: Will be enabled after setup
3. **Analysis Tab**: Will show interview analytics (placeholder for now)

## 🔍 What to Verify

### File Upload
- [ ] Files upload successfully
- [ ] Loading spinner appears during processing
- [ ] Success/error toasts appear appropriately
- [ ] File content is added to the context textarea
- [ ] File list shows uploaded files with sizes
- [ ] Remove file button works

### Interview Types
- [ ] All 12 interview types are visible
- [ ] Tooltips appear on hover
- [ ] Grid layout is responsive (2-4 columns)
- [ ] Selection highlights properly

### Navigation
- [ ] Tabs switch correctly
- [ ] Live Interview tab is disabled until setup complete
- [ ] Analysis tab is disabled until interview starts

## ⚠️ Common Issues

### File Upload Errors
1. **"Please sign in to upload files"**
   - Solution: Log in first at http://localhost:8080/login

2. **"Failed to process file"**
   - Check browser console for detailed error
   - Ensure GEMINI_API_KEY is set in Supabase edge functions
   - Verify file is not corrupted

3. **Network errors**
   - Check that Supabase URL and anon key are correct in .env.local
   - Ensure you have internet connection (for Supabase cloud)

## 🛠️ Debug Commands

```bash
# Check server logs
# The terminal where you ran 'npm run dev'

# Check browser console
# Press F12 and go to Console tab

# Test edge function directly
curl -X POST https://[YOUR_SUPABASE_URL]/functions/v1/parse-document \
  -H "Authorization: Bearer [YOUR_ANON_KEY]" \
  -F "file=@test.pdf" \
  -F "userId=test-user-id"
```

## 📱 Mobile Testing

The app is responsive. Test on different screen sizes:
- Desktop: 4 columns for interview types
- Tablet: 3 columns
- Mobile: 2 columns

## 🎯 Next Steps

After successful testing:
1. Try uploading different file types
2. Test with multiple files
3. Try different interview scenarios
4. Check performance with large files

---

**Server Running at**: http://localhost:5174  
**Interview Room**: http://localhost:5174/interview-room

## 🚀 Starting the Server

Run this command in your terminal:
```bash
./start-dev.sh
```

Or manually:
```bash
npm run dev
```

The server will automatically open in your default browser.