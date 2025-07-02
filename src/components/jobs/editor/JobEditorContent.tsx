
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import { EditorToolbar } from './EditorToolbar';
import { useEffect } from 'react';
import { formatAnalysisContent } from '../utils/formatAnalysis';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface JobEditorContentProps {
  initialContent?: any;
}

export function JobEditorContent({ initialContent }: JobEditorContentProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Underline,
      Heading,
      BulletList,
      OrderedList,
    ],
    content: '',
    editable: true,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4',
      },
    },
  });

  useEffect(() => {
    if (editor) {
      let content = '';
      
      if (initialContent?.enhanced_content) {
        // We have enhanced content from AI, use it directly
        content = initialContent.enhanced_content;
      } else if (initialContent?.analysis) {
        // We have analysis data, format it
        content = formatAnalysisContent(initialContent.analysis);
      } else if (initialContent?.content) {
        // Fallback to using the raw content if no analysis is available
        content = `<h2>Job Description</h2><p>${initialContent.content.replace(/\n/g, '</p><p>')}</p>`;
      } else {
        // No content at all
        content = '<h2>No job content available</h2><p>There was a problem processing the job description. You can manually edit this content or try creating a new job.</p>';
      }
      
      editor.commands.setContent(content);
    }
  }, [editor, initialContent]);

  if (!editor) {
    return (
      <div className="prose max-w-none">
        <div className="border rounded-lg bg-white shadow-sm p-4">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-4 bg-slate-200 rounded col-span-2"></div>
                  <div className="h-4 bg-slate-200 rounded col-span-1"></div>
                </div>
                <div className="h-4 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="prose max-w-none">
      {!initialContent?.analysis && initialContent?.id && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertDescription>
            The job analysis couldn't be generated. You can still edit the content manually.
          </AlertDescription>
        </Alert>
      )}
      <div className="border rounded-lg bg-white shadow-sm">
        <EditorToolbar editor={editor} />
        <div className="p-4">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
