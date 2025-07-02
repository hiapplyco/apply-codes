# Refactoring Plan: Gemini File Upload in `parse-document` Function

## 1. Introduction & Goal

This document outlines the technical plan to refactor the `supabase/functions/parse-document/index.ts` Edge Function. The primary goal is to align our file handling process with the official Google Gemini API best practices for media uploads.

This refactoring will transition from sending file data inline (as a base64 string) to using the dedicated Gemini File API. This will improve the system's efficiency, scalability, and robustness when processing user-uploaded documents such as `.pdf`, `.docx`, `.doc`, and others. Our target model will remain `gemini-2.5-flash`.

## 2. Current Implementation Analysis

The current implementation in `parse-document/index.ts` operates as follows:
1.  Receives a file from a client request.
2.  Reads the file into an `ArrayBuffer`.
3.  Encodes the `ArrayBuffer` into a base64 string.
4.  Calls the Gemini `generateContent` method, passing the base64 string directly in the request body using the `inlineData` field.

While functional, this approach has several drawbacks:
-   **Inefficiency:** Sending large base64 strings with every request is not optimal.
-   **Scalability:** It is not the recommended approach for handling large files or a high volume of requests.
-   **Lack of Lifecycle Management:** We have no mechanism to manage the uploaded files on Google's servers.

## 3. Proposed Architecture & Workflow

The refactored function will adopt the recommended two-step file handling process:

1.  **File Upload:** The function will first upload the raw file data to the Gemini API using the `media.upload` endpoint via the SDK (`ai.files.upload()`). This call will return a `File` object containing a unique `name` and `uri`.
2.  **Polling for Active State:** The function will then poll the Gemini API using the file's `name` (`ai.files.get()`) until its `state` becomes `ACTIVE`, indicating it is ready for processing.
3.  **Content Generation with URI:** Once the file is active, the function will call `generateContent`, referencing the file via its `uri`.
4.  **File Deletion:** After the text has been successfully extracted, the function will delete the file from Google's servers using `ai.files.delete()` to manage resources and associated costs.

This workflow is more robust and aligns with Google's official guidelines.

## 4. Detailed Implementation Steps

The following changes will be made to `supabase/functions/parse-document/index.ts`:

### Step 1: Update Dependencies (If Necessary)
- Ensure the `@google/generative-ai` npm package is up-to-date to guarantee full support for the File API.

### Step 2: Refactor the Main Handler
- **Remove Base64 Encoding:** The logic for converting the file's `ArrayBuffer` to a base64 string will be removed.
- **Instantiate Google AI Client:** An instance of `GoogleGenerativeAI` will be created.

### Step 3: Implement File Upload
- Use the `ai.files.upload()` method from the SDK.
- The file's `ArrayBuffer` and `mimeType` will be passed to this method.

```typescript
// Before
const base64Data = btoa(String.fromCharCode(...uint8Array));
// ... call to generateContent with inlineData

// After
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
console.log('Uploading file to Gemini...');
const uploadedFile = await genAI.files.upload({
  file: new Uint8Array(arrayBuffer), // Pass the raw buffer
  config: {
    mimeType: (file as File).type,
  },
});
console.log('Uploaded file:', uploadedFile.name);
```

### Step 4: Implement Polling for `ACTIVE` State
- A `while` loop will be implemented to poll the file's status.
- The loop will call `ai.files.get({ name: uploadedFile.name })` to fetch the file's metadata.
- A delay (e.g., 1-2 seconds) will be included between polling attempts to avoid rate limiting.
- A timeout mechanism (e.g., a maximum number of retries) will be implemented to prevent an infinite loop in case the file processing fails on Google's end.

```typescript
let fileState = (await genAI.files.get({ name: uploadedFile.name })).state;
let retries = 10; // Max 20 seconds wait
while (fileState !== 'ACTIVE' && retries > 0) {
  if (fileState === 'FAILED') {
    throw new Error('File processing failed on Google's end.');
  }
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
  fileState = (await genAI.files.get({ name: uploadedFile.name })).state;
  retries--;
}

if (fileState !== 'ACTIVE') {
  throw new Error('File processing timed out.');
}
```

### Step 5: Update Content Generation Call
- The `generateContent` call will be modified to use the file's `uri`.
- The `createPartFromUri` helper (or its equivalent) will be used to construct the prompt.

```typescript
// Before
const result = await model.generateContent([
  { inlineData: { data: base64Data, mimeType: (file as File).type } },
  prompt
]);

// After
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const result = await model.generateContent([
  {
    fileData: {
      mimeType: uploadedFile.mimeType,
      fileUri: uploadedFile.uri,
    },
  },
  { text: prompt },
]);
```

### Step 6: Implement File Deletion
- A `finally` block will be added to the main `try...catch` block.
- This block will call `ai.files.delete({ name: uploadedFile.name })` to ensure the file is deleted after processing, regardless of whether the text extraction was successful.

```typescript
finally {
  if (uploadedFile) {
    console.log('Deleting file:', uploadedFile.name);
    await genAI.files.delete({ name: uploadedFile.name });
  }
}
```

### Step 7: Update Error Handling
- The `catch` blocks will be updated to handle potential errors from the new API calls:
  - File upload failures.
  - File processing failures (`state: 'FAILED'`).
  - Polling timeouts.
  - File deletion failures.

## 5. System Prompts

The existing system prompts, which are tailored for different document types, will be preserved. They will be passed to the `generateContent` method alongside the file URI, ensuring the model's output remains high-quality and context-aware.

## 6. Rollback Plan

The proposed changes are confined to the `supabase/functions/parse-document/index.ts` file. In the event of unforeseen issues, we can quickly revert to the previous implementation by restoring the file from our Git history.

