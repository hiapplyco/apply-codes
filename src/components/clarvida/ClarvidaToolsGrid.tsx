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
  image?: string;
}

const tools: ToolItem[] = [
  {
    title: 'Job Description Builder',
    description: 'Create compelling job postings',
    icon: FileText,
    path: '/clarvida/sourcing',
    image: 'https://jobs.clarvida.com/system/production/assets/448688/original/clarvida-counseling-and-therapy.jpg',
  },
  {
    title: 'Boolean Search',
    description: 'Generate targeted searches',
    icon: Search,
    path: '/clarvida/sourcing',
    image: 'https://jobs.clarvida.com/system/production/assets/448686/original/clarvida-autism-services.jpg',
  },
  {
    title: 'Candidate Analysis',
    description: 'AI-powered resume analysis',
    icon: Users,
    path: '/clarvida',
    image: 'https://jobs.clarvida.com/system/production/assets/448689/original/clarvida-child-and-family-services.jpg',
  },
  {
    title: 'Content Creation',
    description: 'Social posts & outreach',
    icon: MessageSquare,
    path: '/clarvida/sourcing',
    image: 'https://jobs.clarvida.com/system/production/assets/448691/original/clarvida-family-preservation-and-support.jpg',
  },
  {
    title: 'Compensation Analysis',
    description: 'Market salary insights',
    icon: BarChart3,
    path: '/clarvida',
    image: 'https://jobs.clarvida.com/system/production/assets/448690/original/clarvida-foster-care.jpg',
  },
  {
    title: 'Interview Questions',
    description: 'Role-specific questions',
    icon: FileSearch,
    path: '/clarvida',
    image: 'https://jobs.clarvida.com/system/production/assets/448693/original/clarvida-residential.jpg',
  },
  {
    title: 'Skills Matching',
    description: 'Nice-to-have analysis',
    icon: Sparkles,
    path: '/clarvida',
    image: 'https://jobs.clarvida.com/system/production/assets/448692/original/clarvida-treatment-support-services.jpg',
  },
  {
    title: 'Talent Locations',
    description: 'Where to find candidates',
    icon: Briefcase,
    path: '/clarvida',
    image: 'https://jobs.clarvida.com/system/production/assets/448687/original/clarvida-assertive-community-treatment.jpg',
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
