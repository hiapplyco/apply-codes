import { Editor } from '@tiptap/react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table,
  ImageIcon,
  Download,
  Upload,
  FileText,
  Palette,
  Highlighter,
  Type,
  Save,
  Clock,
  Undo2,
  Redo2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useRef, useState } from 'react';
import { DocumentImportExport } from '@/utils/documentImportExport';

interface GoogleDocsToolbarProps {
  editor: Editor | null;
  isSaving?: boolean;
  lastSaved?: Date | null;
  onAutoSave?: (content: string) => void;
}

export function GoogleDocsToolbar({ editor, isSaving, lastSaved, onAutoSave }: GoogleDocsToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  if (!editor) {
    return null;
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const result = await DocumentImportExport.importFile(file);
      if (result.success && result.content) {
        editor.commands.setContent(result.content);
      } else {
        alert(`Import failed: ${result.error}`);
      }
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const exportToHTML = () => {
    const content = editor.getHTML();
    DocumentImportExport.exportAsHtml(content, 'job-description.html');
  };

  const exportToText = () => {
    const content = editor.getHTML();
    DocumentImportExport.exportAsText(content, 'job-description.txt');
  };

  const exportToMarkdown = () => {
    const content = editor.getHTML();
    DocumentImportExport.exportAsMarkdown(content, 'job-description.md');
  };

  const printDocument = () => {
    const content = editor.getHTML();
    DocumentImportExport.printDocument(content, 'Job Description');
  };

  const handleManualSave = async () => {
    if (onAutoSave) {
      const content = editor.getHTML();
      await onAutoSave(content);
    }
  };

  const colors = [
    '#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff',
    '#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff',
    '#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b266', '#66a3e0', '#c285ff',
    '#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2',
    '#444444', '#5c0000', '#663d00', '#666600', '#003700', '#002966', '#3d1466'
  ];

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="border-b p-2 space-y-2">
      {/* Top row - File operations and save status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                File
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Import Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToHTML}>
                <Download className="h-4 w-4 mr-2" />
                Export as HTML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToText}>
                <FileText className="h-4 w-4 mr-2" />
                Export as Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToMarkdown}>
                <FileText className="h-4 w-4 mr-2" />
                Export as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={printDocument}>
                <FileText className="h-4 w-4 mr-2" />
                Print Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-3 w-3 border border-gray-300 rounded-full border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          {lastSaved && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Saved {formatLastSaved(lastSaved)}
            </div>
          )}
        </div>
      </div>

      {/* Main toolbar */}
      <div className="flex flex-wrap items-center gap-1">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Text formatting */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-slate-200' : ''}
          title="Bold"
        >
          <BoldIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-slate-200' : ''}
          title="Italic"
        >
          <ItalicIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-slate-200' : ''}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        {/* Text color */}
        <DropdownMenu open={showColorPicker} onOpenChange={setShowColorPicker}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" title="Text Color">
              <Palette className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <div className="grid grid-cols-7 gap-1 p-2">
              {colors.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Highlight */}
        <DropdownMenu open={showHighlightPicker} onOpenChange={setShowHighlightPicker}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" title="Highlight">
              <Highlighter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <div className="grid grid-cols-7 gap-1 p-2">
              {colors.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().setHighlight({ color }).run();
                    setShowHighlightPicker(false);
                  }}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        {/* Headings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" title="Heading">
              <Type className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={editor.isActive('paragraph') ? 'bg-slate-100' : ''}
            >
              Normal text
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'bg-slate-100' : ''}
            >
              <Heading1 className="h-4 w-4 mr-2" />
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'bg-slate-100' : ''}
            >
              <Heading2 className="h-4 w-4 mr-2" />
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive('heading', { level: 3 }) ? 'bg-slate-100' : ''}
            >
              <Heading3 className="h-4 w-4 mr-2" />
              Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-slate-200' : ''}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-slate-200' : ''}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Text alignment */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200' : ''}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200' : ''}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200' : ''}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={editor.isActive({ textAlign: 'justify' }) ? 'bg-slate-200' : ''}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Table */}
        <Button
          variant="ghost"
          size="sm"
          onClick={insertTable}
          title="Insert Table"
        >
          <Table className="h-4 w-4" />
        </Button>

        {/* Image */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => document.getElementById('image-upload')?.click()}
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Hidden file inputs */}
      <Input
        ref={fileInputRef}
        type="file"
        accept=".docx,.txt,.html,.htm"
        onChange={handleDocumentImport}
        className="hidden"
      />
      <Input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        id="image-upload"
      />
    </div>
  );
}