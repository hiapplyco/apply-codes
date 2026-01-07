import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import {
  FileText,
  Search,
  Users,
  Sparkles,
  FileSearch,
  MessageSquare,
  BarChart3,
  Briefcase
} from 'lucide-react';

interface ToolItem {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  image: string;
}

const tools: ToolItem[] = [
  {
    title: 'Job Description Builder',
    description: 'Create compelling job postings',
    icon: FileText,
    path: '/clarvida/sourcing',
    image: '/images/tools/job-description-builder.webp',
  },
  {
    title: 'Boolean Search',
    description: 'Generate targeted searches',
    icon: Search,
    path: '/clarvida/sourcing',
    image: '/images/tools/boolean-search.webp',
  },
  {
    title: 'Candidate Analysis',
    description: 'AI-powered resume analysis',
    icon: Users,
    path: '/clarvida',
    image: '/images/tools/candidate-analysis.webp',
  },
  {
    title: 'Content Creation',
    description: 'Social posts & outreach',
    icon: MessageSquare,
    path: '/clarvida/sourcing',
    image: '/images/tools/content-creation.webp',
  },
  {
    title: 'Compensation Analysis',
    description: 'Market salary insights',
    icon: BarChart3,
    path: '/clarvida',
    image: '/images/tools/compensation-analysis.webp',
  },
  {
    title: 'Interview Questions',
    description: 'Role-specific questions',
    icon: FileSearch,
    path: '/clarvida',
    image: '/images/tools/interview-questions.webp',
  },
  {
    title: 'Skills Matching',
    description: 'Nice-to-have analysis',
    icon: Sparkles,
    path: '/clarvida',
    image: '/images/tools/skills-matching.webp',
  },
  {
    title: 'Talent Locations',
    description: 'Where to find candidates',
    icon: Briefcase,
    path: '/clarvida',
    image: '/images/tools/talent-locations.webp',
  },
];

export const ClarvidaToolsGrid = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 md:py-16 bg-[#E8F4F4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Card
              key={tool.title}
              onClick={() => navigate(tool.path)}
              className="group cursor-pointer overflow-hidden bg-white hover:shadow-lg transition-all duration-300 border-0"
            >
              {/* Image */}
              <div className="relative h-32 overflow-hidden">
                <img
                  src={tool.image}
                  alt={tool.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <div className="p-2 bg-white/90 rounded-lg">
                    <tool.icon className="h-5 w-5 text-[#0B5B5E]" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 text-center">
                <h3 className="font-semibold text-gray-900 group-hover:text-[#0B5B5E] transition-colors">
                  {tool.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
              </div>
            </Card>
          ))}

          {/* Browse All Card */}
          <Card
            onClick={() => navigate('/clarvida/sourcing')}
            className="group cursor-pointer overflow-hidden bg-[#0B5B5E] hover:bg-[#0A4F4F] transition-colors border-0 flex items-center justify-center min-h-[200px]"
          >
            <div className="text-center p-6">
              <Search className="h-10 w-10 text-white mx-auto mb-3" />
              <h3 className="font-semibold text-white text-lg">Browse All Tools</h3>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
