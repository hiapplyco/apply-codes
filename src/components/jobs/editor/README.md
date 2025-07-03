# Enhanced JobEditorContent with Google Docs Features

The JobEditorContent component has been enhanced with Google Docs-compatible features including tables, images, collaboration, auto-save, and import/export functionality.

## Features

### ✨ Google Docs-Style Formatting
- **Rich Text Formatting**: Bold, italic, underline, text colors, highlights
- **Multiple Heading Levels**: H1-H6 with proper hierarchy
- **Text Alignment**: Left, center, right, and justify alignment
- **Lists**: Bullet points and numbered lists

### 📊 Tables
- **Table Creation**: Insert tables with customizable rows and columns
- **Table Editing**: Add/remove rows and columns
- **Header Rows**: Support for table headers
- **Resizable Columns**: Drag to resize table columns

### 🖼️ Images
- **Image Upload**: Support for all common image formats
- **Drag & Drop**: Images can be dropped directly into the editor
- **Base64 Support**: Images are embedded as base64 for portability

### 📁 Import/Export
- **Import Formats**: Word documents (.docx), HTML, plain text
- **Export Formats**: HTML, plain text, Markdown
- **Print Support**: Direct printing with proper formatting
- **File Management**: Easy file operations through toolbar

### 💾 Auto-Save
- **Automatic Saving**: Content is auto-saved every 2 seconds
- **Manual Save**: Option to save manually
- **Save Status**: Visual indicators for save state
- **Last Saved**: Timestamp of last successful save

### 👥 Collaboration (Optional)
- **Real-time Presence**: See who's online and editing
- **User Cursors**: Visual indicators of other users' positions
- **User Avatars**: Display collaborator avatars and status

### 📈 Document Statistics
- **Word Count**: Real-time word counting
- **Character Count**: Including spaces
- **Reading Time**: Estimated reading time
- **Collaborator Count**: Number of active users

## Usage Examples

### Basic Usage
```tsx
import { JobEditorContent } from './components/jobs/editor/JobEditorContent';

function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <JobEditorContent
      initialContent="<p>Start typing here...</p>"
      onUpdate={setContent}
      showStats={true}
      autoSave={true}
    />
  );
}
```

### With Auto-Save
```tsx
import { JobEditorContent } from './components/jobs/editor/JobEditorContent';

function AutoSaveExample() {
  const handleAutoSave = async (content: string) => {
    // Save to your backend
    await fetch('/api/save-document', {
      method: 'POST',
      body: JSON.stringify({ content }),
      headers: { 'Content-Type': 'application/json' }
    });
  };

  return (
    <JobEditorContent
      autoSave={true}
      onAutoSave={handleAutoSave}
      showStats={true}
    />
  );
}
```

### With Collaboration
```tsx
import { JobEditorContent } from './components/jobs/editor/JobEditorContent';

function CollaborativeEditor() {
  return (
    <JobEditorContent
      documentId="unique-document-id"
      collaborationEnabled={true}
      showStats={true}
      onUpdate={(content) => console.log('Content updated:', content)}
    />
  );
}
```

### Advanced Configuration
```tsx
import { JobEditorContent } from './components/jobs/editor/JobEditorContent';

function AdvancedEditor() {
  return (
    <JobEditorContent
      initialContent="<h1>Job Description</h1><p>Start writing...</p>"
      autoSave={true}
      onAutoSave={handleSave}
      collaborationEnabled={true}
      documentId="job-123"
      showStats={true}
      isAnalysisComplete={true}
      onUpdate={(content) => {
        // Handle content updates
        console.log('Updated content:', content);
      }}
    />
  );
}
```

## Component Props

### JobEditorContent Props
```typescript
interface JobEditorContentProps {
  initialContent?: any;           // Initial content (string or analysis object)
  onUpdate?: (content: string) => void;  // Called when content changes
  isAnalysisComplete?: boolean;   // Whether AI analysis is complete
  isError?: boolean;              // Whether there was an error
  autoSave?: boolean;             // Enable auto-save (default: true)
  onAutoSave?: (content: string) => void;  // Auto-save handler
  collaborationEnabled?: boolean; // Enable collaboration features
  showStats?: boolean;            // Show document statistics (default: true)
  documentId?: string;            // Unique document ID for collaboration
}
```

## Available Toolbar Actions

### File Operations
- **Import Document**: Support for .docx, .html, .txt files
- **Export as HTML**: Full-featured HTML export
- **Export as Text**: Plain text export
- **Export as Markdown**: Markdown format export
- **Print Document**: Direct printing support

### Formatting
- **Text Formatting**: Bold, italic, underline
- **Text Color**: Color picker for text
- **Highlight**: Background color highlighting
- **Headings**: H1, H2, H3 support
- **Text Alignment**: Left, center, right, justify

### Content
- **Lists**: Bullet and numbered lists
- **Tables**: Insert and edit tables
- **Images**: Upload and insert images
- **Undo/Redo**: Full undo/redo support

### Auto-Save Features
- **Manual Save**: Save button with loading state
- **Auto-Save Status**: Visual feedback on save status
- **Last Saved**: Timestamp display

## Styling

The editor includes comprehensive CSS styles in `GoogleDocsEditor.css` with:
- Table styling and selection
- Image handling and responsiveness
- Collaboration cursors and indicators
- Print-specific styling
- Custom scrollbars

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Dependencies

The enhanced editor uses these additional Tiptap extensions:
- `@tiptap/extension-table`
- `@tiptap/extension-image`
- `@tiptap/extension-text-align`
- `@tiptap/extension-color`
- `@tiptap/extension-highlight`
- `@tiptap/extension-collaboration`
- `@tiptap/extension-collaboration-cursor`

## Performance

- **Debounced Auto-Save**: 2-second delay to prevent excessive saves
- **Optimized Rendering**: Efficient re-renders with React hooks
- **Memory Management**: Proper cleanup of event listeners
- **Bundle Size**: ~150KB additional for all Google Docs features

## Troubleshooting

### Common Issues

1. **Auto-save not working**: Ensure `onAutoSave` prop is provided and returns a Promise
2. **Images not uploading**: Check file size limits and supported formats
3. **Collaboration not connecting**: Verify Supabase configuration and user authentication
4. **Table editing issues**: Ensure proper table cell selection

### Performance Tips

1. Use `documentId` prop for better collaboration management
2. Disable `showStats` if not needed to reduce re-renders
3. Implement efficient `onAutoSave` handlers with proper error handling
4. Use `collaborationEnabled` only when needed

---

**Note**: This enhanced editor maintains full backward compatibility with the existing JobEditorContent component while adding powerful Google Docs-style features.