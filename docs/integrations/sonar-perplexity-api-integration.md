# Integrating Perplexity Sonar API for Enhanced Search in apply.codes

This document outlines the process of integrating the Perplexity Sonar API into `apply.codes` to power a new search feature. The goal is to allow users to perform a search, have the query sent to the Perplexity API, and store the results within the `apply.codes` system.

**Current Status:** Implemented

## 1. Introduction to Perplexity Sonar API

Perplexity Sonar is a powerful, real-time answer engine that leverages the public internet to deliver up-to-date information. Unlike traditional search engines, Sonar provides direct answers with citations, making it an ideal tool for applications that require accurate, fact-based information.

## 2. Architecture and Security

### Client-Server Separation

To ensure the security of the Perplexity API key and to control access to the service, all API interactions are managed through a server-side proxy. The client-side application does not make direct calls to the Perplexity API.

**Workflow:**

1.  The client makes a request to the dedicated Supabase edge function `/functions/v1/perplexity-search`.
2.  The Supabase edge function receives the request, authenticates the user, and then makes the call to the Perplexity API using the securely stored API key.
3.  The edge function receives the response from the Perplexity API and forwards it to the client.

### Authentication and Authorization

Before processing a search request, the Supabase edge function verifies that the user is authenticated and has the necessary permissions to use the search feature. This is achieved by checking the user's JWT from the `Authorization` header.

## 3. API Integration

### API Key Setup

The Perplexity API key is stored as a secret in the Supabase project with the name `PERPLEXITY_API_KEY`.

### Server-Side Request

The Supabase edge function `perplexity-search` handles all communication with the Perplexity API.

## 4. Data and Caching Strategy

### Database Schema

A `searches` table will store the results of each query.

*   `id`: (PK) Unique identifier.
*   `user_id`: (FK) The ID of the user who performed the search.
*   `project_id`: (FK) The project associated with the search (if applicable).
*   `query`: The original search query.
*   `perplexity_response`: A `JSONB` column for the raw API response.
*   `answer_text`: A `text` column for the extracted answer.
*   `created_at`: A timestamp of when the search was performed.

### Caching Strategy

To improve performance and reduce costs, a caching layer should be implemented for the Perplexity API responses. The recommended approach is to use a Redis instance (e.g., from Upstash) to cache the results of queries.

## 5. Error Handling

Robust error handling is implemented in the Supabase edge function to manage different types of API errors, including `401` (Unauthorized), `429` (Rate Limit Exceeded), and `5xx` (Server Errors).

## 6. UI Implementation

The following components have been created and integrated into the application:

*   `src/components/perplexity/PerplexitySearchButton.tsx`
*   `src/components/perplexity/PerplexitySearchModal.tsx`

### UI Responsiveness

The search modal is designed to be responsive across all screen sizes, using a utility-first CSS framework.

## 7. Global Implementation

The "Search the Internet" button has been added globally by modifying the `src/components/url-scraper/UploadRequirementsButton.tsx` component. This ensures a consistent user experience across the application.

## 8. Next Steps: Data Integration

To complete the integration, the following steps must be taken to ensure that search results are associated with the correct project and that the `onSearchResult` prop is handled correctly in all relevant components.

### Step 1: Update the `perplexity-search` Edge Function

The `perplexity-search` edge function needs to be updated to accept a `projectId` in the request body and to store the search results in the `searches` table.

```typescript
// supabase/functions/perplexity-search/index.ts

// ... (imports and auth checks)

const { query, projectId } = await req.json()

// ... (make API call)

const { data: searchRecord, error: insertError } = await supabase
  .from('searches')
  .insert([
    {
      user_id: user.id,
      project_id: projectId,
      query: query,
      perplexity_response: responseData,
      answer_text: responseData.choices[0].message.content,
    },
  ])

if (insertError) {
  console.error('Error inserting search record:', insertError)
  // Do not block the user, just log the error
}

// ... (return response)
```

### Step 2: Update the `PerplexitySearchModal.tsx` Component

The `PerplexitySearchModal` needs to be updated to accept the `projectId` as a prop and to pass it to the `perplexity-search` edge function.

```typescript
// src/components/perplexity/PerplexitySearchModal.tsx

interface PerplexitySearchModalProps {
  // ... (existing props)
  projectId?: number;
}

// ...

const { data, error } = await supabase.functions.invoke('perplexity-search', {
  body: { query, projectId },
});

// ...
```

### Step 3: Update Parent Components

Finally, update all parent components that use the `UploadRequirementsButton` to pass the `projectId` and a functional `onSearchResult` handler.

**Example in `src/components/search/SearchForm.tsx`:**

```typescript
// src/components/search/SearchForm.tsx

// ...

<UploadRequirementsButton
  onScrapedContent={(content) => {
    // ...
  }}
  onSearchResult={(result) => {
    setInputValue(prev => `${prev}\n\n--- Search Result for "${result.query}" ---\n${result.text}`);
    toast.success('Search result imported successfully');
  }}
  projectId={selectedProjectId} // Pass the project ID
/>

// ...
```

By completing these steps, you will have a fully integrated Perplexity search feature that is secure, efficient, and provides a seamless user experience across the entire `apply.codes` application.
