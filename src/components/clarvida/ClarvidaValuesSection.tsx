interface ValueItem {
  title: string;
  description: string;
}

const values: ValueItem[] = [
  { title: 'Resilience', description: 'Our struggles develop our strengths.' },
  { title: 'Inclusion', description: 'Every voice has a value.' },
  { title: 'Advocacy', description: 'Be the voice of those who need one.' },
  { title: 'Compassion', description: 'Caring can change the world.' },
  { title: 'Accountability', description: 'Our choices are sources of power and pride.' },
];

export const ClarvidaValuesSection = () => {
  return (
    <section className="py-12 md:py-16 bg-[#0B5B5E] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Clarvida Values</h2>
            <p className="text-lg text-white/90 mb-8">
              At Clarvida, our values are the guiding principles that shape our decision-making
              processes, behaviors and culture. Join the team to see our values in action!
            </p>
            <ul className="space-y-4">
              {values.map((value) => (
                <li key={value.title} className="flex items-start gap-3">
                  <span className="font-semibold text-[#D4A03C]">{value.title}:</span>
                  <span className="text-white/90">{value.description}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Image */}
          <div className="relative">
            <img
              src="https://jobs.clarvida.com/system/production/assets/447209/original/clarvida-values-updated.jpg"
              alt="Clarvida Values"
              className="w-full rounded-lg shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
