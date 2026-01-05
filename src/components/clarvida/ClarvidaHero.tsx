export const ClarvidaHero = () => {
  return (
    <div className="relative">
      {/* Hero Image */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        <img
          src="https://jobs.clarvida.com/system/production/assets/442891/original/pathways-hero.jpg"
          alt="Clarvida team"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay for text readability if needed */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20" />
      </div>
    </div>
  );
};
