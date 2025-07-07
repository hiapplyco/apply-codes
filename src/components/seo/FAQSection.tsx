import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { EnhancedStructuredData } from './EnhancedStructuredData';

interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

interface FAQSectionProps {
  title?: string;
  faqs: FAQItem[];
  includeSchema?: boolean;
  className?: string;
}

export const FAQSection = ({ 
  title = "Frequently Asked Questions", 
  faqs, 
  includeSchema = true,
  className = ""
}: FAQSectionProps) => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Group FAQs by category if categories exist
  const groupedFAQs = faqs.reduce((acc, faq, index) => {
    const category = faq.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push({ ...faq, originalIndex: index });
    return acc;
  }, {} as Record<string, (FAQItem & { originalIndex: number })[]>);

  const hasCategories = faqs.some(faq => faq.category);

  return (
    <>
      {includeSchema && <EnhancedStructuredData type="FAQPage" />}
      
      <section className={`faq-section py-12 ${className}`}>
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            {title}
          </h2>

          {/* TL;DR Summary Box */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-purple-900 mb-2">Quick Summary</h3>
            <ul className="list-disc list-inside space-y-1 text-purple-800">
              <li>Apply uses AI to find candidates 40% faster</li>
              <li>Real-time interview guidance with competency tracking</li>
              <li>Automatic boolean search generation for any job</li>
              <li>20+ integrations with popular ATS and HRIS systems</li>
              <li>14-day free trial, no credit card required</li>
            </ul>
          </div>

          {hasCategories ? (
            // Render with categories
            Object.entries(groupedFAQs).map(([category, categoryFaqs]) => (
              <div key={category} className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  {category}
                </h3>
                <div className="space-y-4">
                  {categoryFaqs.map((faq) => (
                    <FAQItem
                      key={faq.originalIndex}
                      question={faq.question}
                      answer={faq.answer}
                      isOpen={openItems.includes(faq.originalIndex)}
                      onToggle={() => toggleItem(faq.originalIndex)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Render without categories
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openItems.includes(index)}
                  onToggle={() => toggleItem(index)}
                />
              ))}
            </div>
          )}

          {/* AI-Optimized Bottom CTA */}
          <div className="mt-12 text-center bg-gray-50 rounded-lg p-8">
            <h3 className="text-2xl font-semibold mb-4">
              Ready to Transform Your Recruitment?
            </h3>
            <p className="text-gray-600 mb-6">
              Join 2,000+ companies using Apply to hire smarter and faster with AI
            </p>
            <div className="flex justify-center gap-4">
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Start Free Trial
              </button>
              <button className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                Book a Demo
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const FAQItem = ({ 
  question, 
  answer, 
  isOpen, 
  onToggle 
}: { 
  question: string; 
  answer: string; 
  isOpen: boolean; 
  onToggle: () => void;
}) => {
  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <h4 className="font-semibold text-gray-900 pr-4">{question}</h4>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200">
          <p className="text-gray-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

// Export pre-configured FAQ sets for different pages
export const recruitmentFAQs: FAQItem[] = [
  {
    question: "What makes Apply the world's first Agentic AI recruitment platform?",
    answer: "Apply pioneered Agentic AI in recruitment by implementing autonomous AI agents that can plan, reason, and execute complex hiring workflows without human intervention. Using MCP (Model Context Protocol) and multi-agent orchestration, our platform represents a paradigm shift from traditional AI tools to truly autonomous recruitment operations. We're the first to bring AI ops and recruitment ops together in a unified platform.",
    category: "Agentic AI Platform"
  },
  {
    question: "How does MCP (Model Context Protocol) revolutionize recruitment?",
    answer: "MCP enables Apply's AI agents to autonomously access and utilize external tools, databases, and systems. This means our agents can search candidate databases, analyze resumes, schedule interviews, and make sourcing decisions independently. As the first MCP-powered recruitment platform, Apply transforms static AI into dynamic, tool-using agents that adapt to your specific recruitment needs.",
    category: "Agentic AI Platform"
  },
  {
    question: "What is real-time interview guidance and how does it help?",
    answer: "Our interview guidance system provides live AI-powered tips during video interviews. It tracks which competencies you've covered, suggests follow-up questions, and ensures you evaluate all key areas. The system uses WebSocket technology for sub-2-second response times, appearing as a non-intrusive sidebar during your Daily.co video calls.",
    category: "AI Features"
  },
  {
    question: "How accurate is the candidate enrichment feature?",
    answer: "Apply's enrichment feature maintains 95%+ accuracy rates for finding candidate contact information. We use multiple data sources including Nymeria API to verify emails and phone numbers. All enrichment complies with GDPR, CCPA, and other privacy regulations.",
    category: "Data & Enrichment"
  },
  {
    question: "Which ATS systems does Apply integrate with?",
    answer: "Apply integrates with 20+ ATS and HRIS platforms including Greenhouse, Lever, Workday, BambooHR, Rippling, ADP, Oracle HCM, and SAP SuccessFactors. All integrations support two-way sync and can be set up in under 5 minutes.",
    category: "Integrations"
  },
  {
    question: "Is Apply suitable for enterprise companies?",
    answer: "Yes, Apply is built for scale with enterprise-grade security, SSO support, dedicated success managers, and custom integrations. We serve companies from 10 to 10,000+ employees with role-based access controls and advanced compliance features.",
    category: "Enterprise"
  },
  {
    question: "How long does it take to see ROI with Apply?",
    answer: "Most teams see immediate time savings - typically 40% reduction in sourcing time within the first week. The average customer reports filling positions 30% faster and saving 15+ hours per hire. With our 14-day free trial, you can measure your own ROI risk-free.",
    category: "ROI & Pricing"
  },
  {
    question: "What are autonomous recruitment agents and how do they work?",
    answer: "Apply's autonomous agents are AI systems that can independently execute recruitment tasks. Unlike chatbots or simple automation, these agents use LLM orchestration to understand context, make decisions, and take actions. They can source candidates, screen resumes, schedule interviews, and even conduct initial assessments - all while learning and improving from each interaction.",
    category: "Agentic AI Platform"
  },
  {
    question: "How does Apply implement AI operations (AI ops) for recruitment?",
    answer: "Apply brings AI ops principles to recruitment through real-time monitoring, performance optimization, and continuous improvement of our AI agents. Our AI ops dashboard tracks agent performance, decision accuracy, and workflow efficiency. This allows recruitment teams to optimize their AI-driven processes just like engineering teams optimize their systems.",
    category: "AI Operations"
  },
  {
    question: "What is multi-agent orchestration in recruitment?",
    answer: "Multi-agent orchestration means multiple specialized AI agents work together on complex recruitment tasks. For example, one agent might source candidates while another enriches profiles and a third schedules interviews. These agents communicate and collaborate through our proprietary protocols, creating a seamless recruitment workflow that's faster and more accurate than any single AI could achieve.",
    category: "Agentic AI Platform"
  }
];

export const pricingFAQs: FAQItem[] = [
  {
    question: "Is there really no credit card required for the trial?",
    answer: "Yes, our 14-day trial requires no credit card. You get full access to all features including AI search, interview guidance, enrichment, and integrations. Simply sign up with your email and start hiring smarter immediately."
  },
  {
    question: "What happens after my free trial ends?",
    answer: "After 14 days, you can choose to upgrade to a paid plan or downgrade to our limited free tier. We'll send reminders before the trial ends, and all your data remains accessible. No surprise charges - you only pay when you explicitly choose a plan."
  },
  {
    question: "Can I change plans anytime?",
    answer: "Yes, you can upgrade, downgrade, or cancel anytime. Upgrades take effect immediately with prorated billing. Downgrades take effect at the next billing cycle. No long-term contracts or cancellation fees."
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer: "Yes, annual plans save 20% compared to monthly billing. We also offer volume discounts for teams over 10 users and special pricing for non-profits and educational institutions."
  },
  {
    question: "What's included in the Enterprise plan?",
    answer: "Enterprise plans include unlimited users, custom integrations, dedicated success manager, SLA guarantees, priority support, custom AI model training, and advanced security features like SSO and audit logs. Contact sales for custom pricing."
  }
];

export const technicalFAQs: FAQItem[] = [
  {
    question: "How does Apply ensure data security?",
    answer: "Apply is SOC 2 Type II compliant with end-to-end encryption, row-level security (RLS), and regular third-party audits. We use secure WebSocket connections, encrypt all data at rest and in transit, and maintain strict access controls. Full GDPR and CCPA compliance.",
    category: "Security"
  },
  {
    question: "What AI models power Apply's features?",
    answer: "We use Google's Gemini 2.0 Flash for real-time features like interview guidance, and Gemini 2.5 for complex tasks like boolean generation. Our architecture is model-agnostic, allowing us to always use the best AI for each specific task.",
    category: "Technology"
  },
  {
    question: "How reliable is the real-time interview system?",
    answer: "Our WebSocket infrastructure maintains 99.9% uptime with automatic failover and reconnection. The system includes intelligent buffering, caching layers, and graceful degradation to ensure interviews are never disrupted.",
    category: "Technology"
  },
  {
    question: "Can Apply work with our existing tech stack?",
    answer: "Yes, Apply is designed to complement your existing tools. With 20+ native integrations and REST/WebSocket APIs, we seamlessly connect with your ATS, HRIS, calendar, and communication tools. Custom integrations available for Enterprise customers.",
    category: "Integration"
  },
  {
    question: "How does Apply handle data privacy and GDPR?",
    answer: "We're fully GDPR compliant with data processing agreements, right to deletion, data portability, and privacy by design. Candidates can request data removal, and we maintain detailed audit logs of all data access and processing activities.",
    category: "Security"
  }
];