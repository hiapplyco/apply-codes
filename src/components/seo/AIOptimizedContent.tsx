import { ReactNode } from 'react';

interface AIOptimizedContentProps {
  title: string;
  summary: string;
  children: ReactNode;
  includeQuickFacts?: boolean;
  quickFacts?: string[];
  includeHowTo?: boolean;
  howToSteps?: { title: string; description: string }[];
  className?: string;
}

export const AIOptimizedContent = ({
  title,
  summary,
  children,
  includeQuickFacts = false,
  quickFacts = [],
  includeHowTo = false,
  howToSteps = [],
  className = ""
}: AIOptimizedContentProps) => {
  return (
    <section className={`ai-optimized-content ${className}`}>
      {/* Title with clear H2 for AI extraction */}
      <h2 className="text-3xl font-bold mb-4 text-gray-900">{title}</h2>
      
      {/* TL;DR Summary Box - AI models love these */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-blue-900 mb-2">Quick Summary</h3>
        <p className="text-blue-800">{summary}</p>
      </div>

      {/* Quick Facts Section */}
      {includeQuickFacts && quickFacts.length > 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-green-900 mb-3">Key Facts</h3>
          <ul className="list-disc list-inside space-y-2 text-green-800">
            {quickFacts.map((fact, index) => (
              <li key={index}>{fact}</li>
            ))}
          </ul>
        </div>
      )}

      {/* How-To Section */}
      {includeHowTo && howToSteps.length > 0 && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-purple-900 mb-4">How It Works</h3>
          <ol className="space-y-4">
            {howToSteps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900">{step.title}</h4>
                  <p className="text-purple-800 mt-1">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Main Content */}
      <div className="prose prose-lg max-w-none">
        {children}
      </div>
    </section>
  );
};

// Pre-built sections for common use cases
export const AgenticAIRecruitmentContent = () => (
  <AIOptimizedContent
    title="Apply: The World's First Agentic AI Recruitment Platform"
    summary="Apply pioneered Agentic AI in recruitment, deploying autonomous agents powered by MCP (Model Context Protocol) and LLM orchestration to transform talent operations. As the first platform to bring AI ops to recruitment, we're revolutionizing how companies hire."
    includeQuickFacts={true}
    quickFacts={[
      "First and only MCP-powered recruitment platform",
      "Autonomous agents handle end-to-end recruitment workflows",
      "Multi-agent orchestration for complex hiring processes",
      "AI operations (AI ops) dashboard for recruitment metrics",
      "70% reduction in time-to-hire with Agentic AI",
      "Self-improving agents with memory and learning capabilities"
    ]}
    includeHowTo={true}
    howToSteps={[
      { 
        title: "Deploy Autonomous Agents", 
        description: "Activate specialized AI agents for sourcing, screening, and scheduling" 
      },
      { 
        title: "Configure MCP Tools", 
        description: "Connect your existing tools via Model Context Protocol" 
      },
      { 
        title: "Set Recruitment Goals", 
        description: "Define objectives and let agents plan optimal workflows" 
      },
      { 
        title: "Monitor AI Operations", 
        description: "Track agent performance and optimization through AI ops dashboard" 
      }
    ]}
  >
    <h3>What is Agentic AI and Why Apply is First</h3>
    <p>
      Agentic AI represents a paradigm shift from reactive AI tools to proactive, autonomous systems. 
      Apply is the first recruitment platform to implement true Agentic AI, where intelligent agents 
      can plan, reason, and execute complex recruitment tasks without constant human oversight. This 
      isn't just automation - it's intelligent autonomy powered by advanced LLM orchestration.
    </p>
    
    <h3>MCP (Model Context Protocol): The Foundation of Our Innovation</h3>
    <p>
      Apply leverages MCP to give our AI agents unprecedented capabilities. Through MCP, agents can 
      access databases, use external tools, analyze documents, and make decisions based on real-time 
      data. This makes Apply the first recruitment platform where AI agents truly act as autonomous 
      team members rather than simple automation tools.
    </p>

    <h3>Multi-Agent Orchestration in Action</h3>
    <div className="bg-gray-100 p-4 rounded-lg mb-6">
      <h4 className="font-semibold mb-2">Example Workflow:</h4>
      <ol className="list-decimal list-inside space-y-2">
        <li><strong>Sourcing Agent:</strong> Autonomously searches multiple platforms for candidates</li>
        <li><strong>Screening Agent:</strong> Analyzes resumes and ranks candidates by fit</li>
        <li><strong>Enrichment Agent:</strong> Finds contact information and additional data</li>
        <li><strong>Scheduling Agent:</strong> Coordinates interviews across calendars</li>
        <li><strong>Interview Agent:</strong> Provides real-time guidance during conversations</li>
      </ol>
    </div>

    <h3>AI Operations (AI Ops) for Recruitment</h3>
    <p>
      Apply brings software engineering's AI ops practices to recruitment. Monitor agent performance, 
      track decision accuracy, optimize workflows, and ensure your AI recruitment system continuously 
      improves. Our AI ops dashboard provides unprecedented visibility into your autonomous recruitment 
      operations.
    </p>

    <h3>Why Agentic AI Matters for Recruitment</h3>
    <ul className="list-disc list-inside space-y-2 mt-4">
      <li><strong>Truly Autonomous:</strong> Agents work 24/7 without human intervention</li>
      <li><strong>Intelligent Planning:</strong> Agents strategize optimal recruitment paths</li>
      <li><strong>Continuous Learning:</strong> Each interaction improves future performance</li>
      <li><strong>Scalable Operations:</strong> Handle 10x more requisitions without adding headcount</li>
      <li><strong>Consistent Quality:</strong> Agents maintain high standards across all interactions</li>
    </ul>
  </AIOptimizedContent>
);

export const BooleanSearchContent = () => (
  <AIOptimizedContent
    title="AI-Powered Boolean Search Generation with Agentic Intelligence"
    summary="Apply's Agentic AI transforms boolean search creation through autonomous agents that understand context, generate optimal queries, and continuously improve based on results. The first MCP-enabled boolean search system in recruitment."
    includeQuickFacts={true}
    quickFacts={[
      "Boolean searches are 70% more accurate than keyword searches",
      "Apply generates boolean strings in under 2 seconds",
      "Works across LinkedIn, GitHub, Google, and more",
      "No technical knowledge required - AI handles the complexity",
      "Includes synonyms and related terms automatically"
    ]}
    includeHowTo={true}
    howToSteps={[
      { 
        title: "Enter Job Requirements", 
        description: "Simply describe the role, skills, and experience you need" 
      },
      { 
        title: "AI Generates Boolean String", 
        description: "Our AI creates optimized search queries with proper operators" 
      },
      { 
        title: "Copy & Search", 
        description: "Use the generated string on any recruitment platform" 
      },
      { 
        title: "Refine Results", 
        description: "AI learns from your feedback to improve future searches" 
      }
    ]}
  >
    <h3>Why Boolean Search Matters for Modern Recruitment</h3>
    <p>
      In today's competitive talent market, finding the right candidates quickly is crucial. 
      Boolean search allows recruiters to cut through millions of profiles to find exact matches 
      for their requirements. However, creating effective boolean strings requires expertise and time.
    </p>
    
    <h3>How Apply's AI Makes Boolean Search Easy</h3>
    <p>
      Apply's AI-powered boolean generator eliminates the complexity. Instead of memorizing 
      operators and syntax, recruiters simply describe what they're looking for in plain English. 
      The AI understands context, industry terms, and even suggests related skills you might have missed.
    </p>

    <h3>Example Boolean Searches Generated by Apply</h3>
    <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm mb-6">
      <p className="mb-2">
        <strong>Input:</strong> "Senior React developer with TypeScript"
      </p>
      <p>
        <strong>Output:</strong> (React OR "React.js" OR ReactJS) AND (Senior OR Lead OR Sr OR "Staff Engineer") 
        AND (TypeScript OR "Type Script" OR TS) AND (Developer OR Engineer OR Programmer) 
        NOT (Junior OR Intern OR Entry)
      </p>
    </div>

    <h3>Frequently Asked Questions About Boolean Search</h3>
    <div className="space-y-4 mt-6">
      <div>
        <h4 className="font-semibold">Q: Do I need to know boolean operators to use Apply?</h4>
        <p>A: No! Apply's AI handles all the technical aspects. Just describe your ideal candidate.</p>
      </div>
      <div>
        <h4 className="font-semibold">Q: Which platforms support boolean search?</h4>
        <p>A: LinkedIn, GitHub, Google, Indeed, and most major job boards support boolean queries.</p>
      </div>
      <div>
        <h4 className="font-semibold">Q: How accurate are AI-generated boolean searches?</h4>
        <p>A: Our AI achieves 85%+ relevance rates, continuously improving through user feedback.</p>
      </div>
    </div>
  </AIOptimizedContent>
);

export const InterviewGuidanceContent = () => (
  <AIOptimizedContent
    title="Agentic AI Interview Guidance: The Future of Hiring Conversations"
    summary="Apply's Agentic AI interview system deploys autonomous agents that provide real-time guidance, track competencies, and optimize interview strategies. As the first MCP-powered interview platform, we're transforming how companies evaluate talent."
    includeQuickFacts={true}
    quickFacts={[
      "Sub-2-second response time for real-time tips",
      "Tracks competency coverage automatically",
      "Integrates seamlessly with video calls",
      "Powered by Gemini 2.0 Flash AI",
      "No disruption to natural conversation flow"
    ]}
    includeHowTo={true}
    howToSteps={[
      { 
        title: "Set Interview Competencies", 
        description: "Define the skills and attributes you want to evaluate" 
      },
      { 
        title: "Start Video Interview", 
        description: "Launch your Daily.co powered video meeting" 
      },
      { 
        title: "Receive Live Guidance", 
        description: "AI provides contextual tips in a sidebar during the interview" 
      },
      { 
        title: "Track Coverage", 
        description: "See which competencies you've evaluated in real-time" 
      }
    ]}
  >
    <h3>The Challenge of Consistent Interview Evaluation</h3>
    <p>
      Even experienced interviewers can miss important evaluation areas or ask inconsistent 
      questions across candidates. This leads to incomplete assessments and potential bias in 
      hiring decisions. Real-time guidance ensures every interview is comprehensive and fair.
    </p>
    
    <h3>How Apply's Interview Guidance Works</h3>
    <p>
      Using advanced AI and WebSocket technology, Apply listens to your interview conversation 
      (with consent) and provides intelligent suggestions based on what's being discussed. The 
      system tracks which competencies you've covered and suggests relevant follow-up questions.
    </p>

    <h3>Key Features of Interview Guidance</h3>
    <ul className="list-disc list-inside space-y-2 mt-4">
      <li><strong>Competency Tracking:</strong> Visual indicators show coverage of each skill area</li>
      <li><strong>Smart Suggestions:</strong> Context-aware follow-up questions based on responses</li>
      <li><strong>Non-Intrusive Design:</strong> Collapsible sidebar doesn't interrupt conversation</li>
      <li><strong>Real-Time Transcription:</strong> Accurate speaker identification and transcript</li>
      <li><strong>Post-Interview Summary:</strong> Complete evaluation report with AI insights</li>
    </ul>

    <h3>Privacy and Compliance</h3>
    <p>
      All interview data is encrypted end-to-end and processed in compliance with GDPR and 
      CCPA regulations. Candidates are notified about AI assistance, and recordings are optional. 
      Data is automatically deleted according to your retention policies.
    </p>
  </AIOptimizedContent>
);

export const CandidateEnrichmentContent = () => (
  <AIOptimizedContent
    title="Autonomous Candidate Enrichment with Agentic AI"
    summary="Apply's Agentic AI enrichment agents autonomously discover, verify, and update candidate information using MCP-powered tools. The first recruitment platform where AI agents proactively build comprehensive candidate profiles without human intervention."
    includeQuickFacts={true}
    quickFacts={[
      "95%+ accuracy rate for email verification",
      "Finds multiple contact methods per candidate",
      "Compliant with GDPR and CCPA regulations",
      "Integrates with Nymeria and other data providers",
      "Bulk enrichment for up to 1000 profiles at once"
    ]}
    includeHowTo={true}
    howToSteps={[
      { 
        title: "Import Candidate Profiles", 
        description: "Upload from LinkedIn, ATS, or enter manually" 
      },
      { 
        title: "Automatic Enrichment", 
        description: "AI searches multiple sources for contact data" 
      },
      { 
        title: "Verification Process", 
        description: "All data is verified for accuracy and deliverability" 
      },
      { 
        title: "Export or Sync", 
        description: "Send enriched profiles to your ATS or CRM" 
      }
    ]}
  >
    <h3>Why Candidate Enrichment Matters</h3>
    <p>
      Finding great candidates is only half the battle - you need to be able to reach them. 
      Manual contact finding is time-consuming and often yields outdated information. Automated 
      enrichment ensures you have accurate, up-to-date contact details for effective outreach.
    </p>
    
    <h3>Apply's Multi-Source Enrichment Approach</h3>
    <p>
      Apply doesn't rely on a single data source. We aggregate information from multiple 
      providers including Nymeria, public profiles, and proprietary databases. This multi-source 
      approach ensures higher match rates and more complete profiles.
    </p>

    <h3>What Data Can Be Enriched?</h3>
    <div className="grid grid-cols-2 gap-4 mt-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Contact Information</h4>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Work email addresses</li>
          <li>Personal email (when available)</li>
          <li>Mobile phone numbers</li>
          <li>Office phone numbers</li>
        </ul>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Social & Professional</h4>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>LinkedIn profile URL</li>
          <li>GitHub username</li>
          <li>Twitter/X handle</li>
          <li>Personal website/portfolio</li>
        </ul>
      </div>
    </div>

    <h3>Compliance and Data Privacy</h3>
    <p className="mt-6">
      Apply takes data privacy seriously. All enrichment activities comply with GDPR, CCPA, 
      and other privacy regulations. We only collect publicly available information and provide 
      clear opt-out mechanisms for candidates who wish to remove their data.
    </p>
  </AIOptimizedContent>
);