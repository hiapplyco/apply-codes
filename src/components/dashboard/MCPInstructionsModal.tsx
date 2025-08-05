import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Copy, CheckCircle, Terminal, Sparkles } from "lucide-react";
import { useState } from "react";

interface MCPInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MCPInstructionsModal = ({ isOpen, onClose }: MCPInstructionsModalProps) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const configExample = `{
  "mcpServers": {
    "apply-recruitment": {
      "command": "node",
      "args": ["/path/to/apply-codes/mcp-server/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-api-key-here"
      }
    }
  }
}`;

  const testCommand = `node mcp-server/test-boolean-direct.js`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            MCP (Model Context Protocol) Setup
          </DialogTitle>
          <DialogDescription>
            Enable AI-powered recruitment tools in Claude Desktop
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">What is MCP?</h3>
              <p className="text-sm text-gray-700">
                Model Context Protocol enables AI assistants like Claude to interact with your recruitment tools 
                directly. With Apply's MCP server, Claude can generate boolean searches, analyze job requirements, 
                parse resumes, and more.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Key Features</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span><strong>Boolean Search:</strong> AI-powered query generation for LinkedIn, Indeed, and GitHub</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span><strong>Job Analysis:</strong> Extract structured requirements from job descriptions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span><strong>Resume Parsing:</strong> Process PDF, DOCX, and text resumes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span><strong>Document Matching:</strong> Compare candidates to job requirements</span>
                </li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="setup" className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold">1. Install Dependencies</h3>
              <div className="bg-gray-50 border rounded-lg p-3">
                <code className="text-sm">cd mcp-server && npm install && npm run build</code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-2"
                  onClick={() => copyToClipboard("cd mcp-server && npm install && npm run build", "install")}
                >
                  {copiedSection === "install" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">2. Configure Claude Desktop</h3>
              <p className="text-sm text-gray-600">
                Add to your Claude Desktop config file:
              </p>
              <div className="text-xs text-gray-500 mb-2">
                <p>macOS: ~/Library/Application Support/Claude/claude_desktop_config.json</p>
                <p>Windows: %APPDATA%\Claude\claude_desktop_config.json</p>
              </div>
              <div className="bg-gray-50 border rounded-lg p-3 relative">
                <pre className="text-xs overflow-x-auto">{configExample}</pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(configExample, "config")}
                >
                  {copiedSection === "config" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">3. Test Connection</h3>
              <div className="bg-gray-50 border rounded-lg p-3">
                <code className="text-sm">{testCommand}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-2"
                  onClick={() => copyToClipboard(testCommand, "test")}
                >
                  {copiedSection === "test" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Restart Claude Desktop after configuration changes.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <h3 className="font-semibold">Available MCP Tools</h3>
            
            <div className="space-y-3">
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-sm">boolean_search</span>
                </div>
                <p className="text-xs text-gray-600">
                  Generate and execute advanced boolean queries from natural language
                </p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                  "Find senior React developers with TypeScript in San Francisco"
                </code>
              </div>

              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-sm">analyze_job_requirements</span>
                </div>
                <p className="text-xs text-gray-600">
                  Extract structured data from job descriptions
                </p>
              </div>

              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-sm">parse_resume</span>
                </div>
                <p className="text-xs text-gray-600">
                  Process resumes in PDF, DOCX, or text format
                </p>
              </div>

              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-sm">compare_documents</span>
                </div>
                <p className="text-xs text-gray-600">
                  Match resumes against job requirements with scoring
                </p>
              </div>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Pro Tip:</strong> Ask Claude "Use MCP tools to find React developers" and it will 
                automatically use these tools!
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => window.open("https://github.com/hiapplyco/apply-codes/tree/main/mcp-server", "_blank")}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            View Documentation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};