import React, { useState } from 'react';
import {
    Book,
    Code,
    Terminal,
    Zap,
    Search,
    FileText,
    Rocket,
    Settings,
    Link,
    ChevronRight,
    Copy,
    CheckCircle2,
    ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const integrationsList = [
    { id: 'bullhorn', name: 'Bullhorn', category: 'ATS', logo: '🎯', popular: true },
    { id: 'greenhouse', name: 'Greenhouse', category: 'ATS', logo: '🌿', popular: true },
    { id: 'lever', name: 'Lever', category: 'ATS', logo: '📊', popular: true },
    { id: 'workday', name: 'Workday', category: 'HRIS', logo: '☁️' },
    { id: 'bamboohr', name: 'BambooHR', category: 'HRIS', logo: '🎋' },
    { id: 'salesforce', name: 'Salesforce', category: 'CRM', logo: '☁️' },
    { id: 'hubspot', name: 'HubSpot', category: 'CRM', logo: '🧡' },
    { id: 'rippling', name: 'Rippling', category: 'HRIS', logo: '💧', popular: true },
    { id: 'ashby', name: 'Ashby', category: 'ATS', logo: '🚀' },
];

export default function Documentation() {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(id);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const CodeBlock = ({ code, id, language = 'bash' }: { code: string; id: string; language?: string }) => (
        <div className="relative group">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto border border-border">
                <code className={`language-${language}`}>{code}</code>
            </pre>
            <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 hover:bg-gray-700 text-white"
                onClick={() => copyToClipboard(code, id)}
            >
                {copiedCode === id ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <Copy className="h-4 w-4" />
                )}
            </Button>
        </div>
    );

    return (
        <div className="container mx-auto py-8 px-4 space-y-8 max-w-7xl">
            {/* Hero Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/30">
                    <Book className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-primary">Documentation</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold">Apply Codes Platform Guide</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Everything you need to know about using Apply Codes for AI-powered recruiting
                </p>
            </div>

            {/* Main Documentation Tabs */}
            <Tabs defaultValue="getting-started" className="space-y-6">
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full bg-muted p-1 rounded-lg">
                    <TabsTrigger value="getting-started" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        Getting Started
                    </TabsTrigger>
                    <TabsTrigger value="mcp-server" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        MCP Server
                    </TabsTrigger>
                    <TabsTrigger value="platform-features" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        Platform Features
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        Integrations
                    </TabsTrigger>
                </TabsList>

                {/* Getting Started Tab */}
                <TabsContent value="getting-started" className="space-y-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Rocket className="h-6 w-6 text-primary" />
                                Welcome to Apply Codes
                            </CardTitle>
                            <CardDescription>Your AI-powered recruiting assistant</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-3">What is Apply Codes?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Apply Codes is an AI-powered platform designed to streamline your recruiting workflow.
                                    From boolean search generation to candidate sourcing, interview preparation, and content creation,
                                    we help you work smarter, not harder.
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-primary/5 rounded-lg border border-border">
                                    <Search className="h-8 w-8 text-primary mb-2" />
                                    <h4 className="font-semibold mb-1">Smart Sourcing</h4>
                                    <p className="text-sm text-muted-foreground">Generate boolean searches and find candidates across platforms</p>
                                </div>
                                <div className="p-4 bg-info/10 rounded-lg border border-border">
                                    <FileText className="h-8 w-8 text-info mb-2" />
                                    <h4 className="font-semibold mb-1">Content Creation</h4>
                                    <p className="text-sm text-muted-foreground">Create job descriptions, emails, and LinkedIn posts with AI</p>
                                </div>
                                <div className="p-4 bg-success/10 rounded-lg border border-border">
                                    <Terminal className="h-8 w-8 text-success mb-2" />
                                    <h4 className="font-semibold mb-1">MCP Server</h4>
                                    <p className="text-sm text-muted-foreground">Integrate with Claude Desktop for powerful AI workflows</p>
                                </div>
                                <div className="p-4 bg-warning/10 rounded-lg border border-border">
                                    <Zap className="h-8 w-8 text-warning mb-2" />
                                    <h4 className="font-semibold mb-1">Automation</h4>
                                    <p className="text-sm text-muted-foreground">Automate repetitive tasks and focus on what matters</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-3">Quick Start</h3>
                                <ol className="space-y-3">
                                    <li className="flex gap-3">
                                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">1</span>
                                        <span className="text-muted-foreground"><strong>Navigate to Sourcing:</strong> Use the search feature to generate boolean queries for any role</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">2</span>
                                        <span className="text-muted-foreground"><strong>Create Content:</strong> Visit the Content Creation page for job descriptions and outreach emails</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">3</span>
                                        <span className="text-muted-foreground"><strong>Set Up MCP:</strong> Install the MCP server to use Apply Codes within Claude Desktop</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">4</span>
                                        <span className="text-muted-foreground"><strong>Integrate Systems:</strong> Connect your ATS, HRIS, or CRM for seamless workflows</span>
                                    </li>
                                </ol>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* MCP Server Tab */}
                <TabsContent value="mcp-server" className="space-y-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code className="h-6 w-6 text-primary" />
                                Apply Codes MCP Server
                            </CardTitle>
                            <CardDescription>Use Apply Codes directly within Claude Desktop</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-info/10 p-4 rounded-lg border border-border">
                                <h4 className="font-semibold text-info mb-2">What is MCP?</h4>
                                <p className="text-sm text-info">
                                    Model Context Protocol (MCP) allows Claude Desktop to connect to external tools and services.
                                    The Apply Codes MCP server gives you access to all platform features directly in your Claude conversations.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-3">Installation</h3>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">1. Install via NPM</h4>
                                        <CodeBlock
                                            id="npm-install"
                                            code="npm install -g @hiapply/mcp-server"
                                        />
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">2. Configure Claude Desktop</h4>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Add this configuration to your Claude Desktop config file:
                                        </p>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Location: <code className="bg-muted px-2 py-1 rounded">~/Library/Application Support/Claude/claude_desktop_config.json</code>
                                        </p>
                                        <CodeBlock
                                            id="mcp-config"
                                            language="json"
                                            code={`{
  "mcpServers": {
    "apply-codes": {
      "command": "npx",
      "args": ["-y", "@hiapply/mcp-server"],
      "env": {
        "APPLY_CODES_API_KEY": "your-api-key-here"
      }
    }
  }
}`}
                                        />
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">3. Get Your API Key</h4>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Navigate to Settings → API Keys to generate your personal API key
                                        </p>
                                        <Button>
                                            <Settings className="h-4 w-4 mr-2" />
                                            Go to Settings
                                        </Button>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">4. Restart Claude Desktop</h4>
                                        <p className="text-sm text-muted-foreground">
                                            After saving the configuration, restart Claude Desktop to activate the MCP server.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-3">Available Tools</h3>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {[
                                        { name: 'generate_boolean_search', desc: 'Create boolean queries for any role' },
                                        { name: 'search_candidates', desc: 'Find candidates across platforms' },
                                        { name: 'create_job_description', desc: 'Generate compelling JDs' },
                                        { name: 'generate_email', desc: 'Create personalized outreach' },
                                        { name: 'analyze_resume', desc: 'Parse and analyze resumes' },
                                        { name: 'generate_interview_questions', desc: 'Prepare for interviews' },
                                    ].map((tool) => (
                                        <div key={tool.name} className="p-3 bg-muted rounded border border-border">
                                            <code className="text-sm font-mono text-primary">{tool.name}</code>
                                            <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-3">Example Usage</h3>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <p>Once installed, you can use Apply Codes tools in your Claude conversations:</p>
                                    <div className="bg-muted p-3 rounded border border-border">
                                        <p className="font-medium text-foreground mb-1">You:</p>
                                        <p className="italic">"Generate a boolean search for Senior React Developers in San Francisco"</p>
                                        <p className="font-medium text-foreground mt-3 mb-1">Claude:</p>
                                        <p className="italic">[Uses generate_boolean_search tool and returns optimized query]</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle>Troubleshooting</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <h4 className="font-semibold mb-1">MCP Server Not Showing Up?</h4>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>Verify the config file path is correct for your OS</li>
                                    <li>Check that your API key is valid</li>
                                    <li>Ensure Claude Desktop is fully restarted</li>
                                    <li>Look for errors in Claude Desktop's developer console</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1">API Key Issues?</h4>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>Generate a new API key in Settings</li>
                                    <li>Make sure the key is properly escaped in JSON</li>
                                    <li>Check that your subscription is active</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Platform Features Tab */}
                <TabsContent value="platform-features" className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Search className="h-5 w-5 text-primary" />
                                    Boolean Search Generator
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Generate precise boolean search strings for LinkedIn, Indeed, and other platforms.
                                </p>
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Features:</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                                            <span>AI-powered query optimization</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                                            <span>Platform-specific syntax</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                                            <span>Save and reuse queries</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                                            <span>Export to ATS</span>
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-info" />
                                    Content Creation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Create professional recruiting content with AI assistance.
                                </p>
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">What You Can Create:</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-info" />
                                            <span>Job descriptions</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-info" />
                                            <span>Outreach emails</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-info" />
                                            <span>LinkedIn posts</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-info" />
                                            <span>Interview guides</span>
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Terminal className="h-5 w-5 text-success" />
                                    Interview Co-Pilot
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Real-time AI assistance during video interviews.
                                </p>
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Capabilities:</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-success" />
                                            <span>Question suggestions</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-success" />
                                            <span>Live transcription</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-success" />
                                            <span>Competency tracking</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-success" />
                                            <span>Follow-up recommendations</span>
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Link className="h-5 w-5 text-warning" />
                                    Integrations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Connect your existing tools for a seamless workflow.
                                </p>
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Supported Systems:</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-warning" />
                                            <span>ATS (Greenhouse, Lever, Bullhorn)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-warning" />
                                            <span>HRIS (BambooHR, Workday)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-warning" />
                                            <span>CRM (Salesforce, HubSpot)</span>
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Integrations Tab */}
                <TabsContent value="integrations" className="space-y-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle>Available Integrations</CardTitle>
                            <CardDescription>Connect Apply Codes with your existing recruiting stack</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Category: ATS */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <Badge variant="outline" className="border-primary text-primary">ATS</Badge>
                                        Applicant Tracking Systems
                                    </h3>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {integrationsList.filter(i => i.category === 'ATS').map((integration) => (
                                            <div
                                                key={integration.id}
                                                className="p-4 bg-white rounded-lg border border-border transition-all"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-3xl">{integration.logo}</span>
                                                    <div>
                                                        <h4 className="font-semibold">{integration.name}</h4>
                                                        {integration.popular && (
                                                            <Badge variant="secondary" className="text-xs">Popular</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full border border-border mt-2"
                                                    onClick={() => toast.info(`Contact sales@hiapply.com to enable ${integration.name} integration`)}
                                                >
                                                    Request Integration
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Category: HRIS */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <Badge variant="outline" className="border-info text-info">HRIS</Badge>
                                        HR Information Systems
                                    </h3>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {integrationsList.filter(i => i.category === 'HRIS').map((integration) => (
                                            <div
                                                key={integration.id}
                                                className="p-4 bg-white rounded-lg border border-border transition-all"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-3xl">{integration.logo}</span>
                                                    <div>
                                                        <h4 className="font-semibold">{integration.name}</h4>
                                                        {integration.popular && (
                                                            <Badge variant="secondary" className="text-xs">Popular</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full border border-border mt-2"
                                                    onClick={() => toast.info(`Contact sales@hiapply.com to enable ${integration.name} integration`)}
                                                >
                                                    Request Integration
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Category: CRM */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <Badge variant="outline" className="border-success text-success">CRM</Badge>
                                        Customer Relationship Management
                                    </h3>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {integrationsList.filter(i => i.category === 'CRM').map((integration) => (
                                            <div
                                                key={integration.id}
                                                className="p-4 bg-white rounded-lg border border-border transition-all"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-3xl">{integration.logo}</span>
                                                    <div>
                                                        <h4 className="font-semibold">{integration.name}</h4>
                                                        {integration.popular && (
                                                            <Badge variant="secondary" className="text-xs">Popular</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full border border-border mt-2"
                                                    onClick={() => toast.info(`Contact sales@hiapply.com to enable ${integration.name} integration`)}
                                                >
                                                    Request Integration
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-info/10 rounded-lg border border-border">
                                    <h4 className="font-semibold text-info mb-2">Need a Custom Integration?</h4>
                                    <p className="text-sm text-info mb-3">
                                        We build custom integrations for enterprise customers. Contact our sales team to discuss your requirements.
                                    </p>
                                    <Button>
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Contact Sales
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Resources Section */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle>Additional Resources</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <Button variant="outline" className="h-auto flex-col items-start p-4 border border-border">
                            <Book className="h-6 w-6 mb-2" />
                            <div className="text-left">
                                <h4 className="font-semibold">API Documentation</h4>
                                <p className="text-xs text-muted-foreground mt-1">Full API reference and examples</p>
                            </div>
                        </Button>
                        <Button variant="outline" className="h-auto flex-col items-start p-4 border border-border">
                            <Terminal className="h-6 w-6 mb-2" />
                            <div className="text-left">
                                <h4 className="font-semibold">GitHub Repository</h4>
                                <p className="text-xs text-muted-foreground mt-1">Contribute to our open source projects</p>
                            </div>
                        </Button>
                        <Button variant="outline" className="h-auto flex-col items-start p-4 border border-border">
                            <Code className="h-6 w-6 mb-2" />
                            <div className="text-left">
                                <h4 className="font-semibold">Community Forum</h4>
                                <p className="text-xs text-muted-foreground mt-1">Get help from other users</p>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
