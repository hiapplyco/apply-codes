import { Card } from '@/components/ui/card';

interface BenefitItem {
  title: string;
  description: string;
  image: string;
}

const benefits: BenefitItem[] = [
  {
    title: 'Benefits',
    description:
      'We offer competitive salaries, tuition reimbursement, paid time off, premium health insurance, 401K with company match, employee discounts and more.',
    image: 'https://jobs.clarvida.com/system/production/assets/448694/original/clarvida-benefits.jpg',
  },
  {
    title: 'Professional Development',
    description:
      'We invest in your growth through a variety of personal and professional training programs.',
    image: 'https://jobs.clarvida.com/system/production/assets/448696/original/clarvida-professional-dev.jpg',
  },
  {
    title: 'Career Advancement',
    description:
      'We unlock opportunities for advancement by helping employees develop career roadmaps and action plans to reach their goals.',
    image: 'https://jobs.clarvida.com/system/production/assets/448695/original/clarvida-career-advancement.jpg',
  },
];

export const ClarvidaWhyJoinSection = () => {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10">
          Why join the Clarvida team?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit) => (
            <Card key={benefit.title} className="overflow-hidden border-0 shadow-sm">
              <div className="aspect-video overflow-hidden">
                <img
                  src={benefit.image}
                  alt={benefit.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
