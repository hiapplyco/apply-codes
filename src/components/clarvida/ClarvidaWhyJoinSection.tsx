import { Card } from '@/components/ui/card';
import { Zap, Target, Brain } from 'lucide-react';

interface FeatureItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

const features: FeatureItem[] = [
  {
    title: 'AI-Powered Sourcing',
    description:
      'Generate sophisticated boolean search strings in seconds. Our AI understands job requirements and creates recruiter-grade queries that find the exact candidates you need.',
    icon: Brain,
    gradient: 'from-purple-500 to-indigo-600',
  },
  {
    title: 'Streamlined Workflow',
    description:
      'Build job descriptions, generate boolean searches, and analyze candidates all in one place. No more switching between tools or copy-pasting between applications.',
    icon: Zap,
    gradient: 'from-teal-500 to-emerald-600',
  },
  {
    title: 'Precision Targeting',
    description:
      'Our intelligent matching analyzes skills, experience, and qualifications to surface the most qualified candidates. Spend less time screening, more time hiring.',
    icon: Target,
    gradient: 'from-orange-500 to-rose-600',
  },
];

export const ClarvidaWhyJoinSection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why use Apply, Co.?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The intelligent recruiting platform that transforms how you find and hire talent
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white"
            >
              {/* Gradient header with icon */}
              <div className={`h-32 bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}>
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <feature.icon className="h-10 w-10 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
