
import { Experience } from "../search/types";

interface ExperienceInformationProps {
  experience: Experience[];
}

export const ExperienceInformation = ({ experience }: ExperienceInformationProps) => {
  return (
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Experience</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {experience.map((exp, i) => (
          <div key={i} className="border-l-2 border-[#8B5CF6] pl-3">
            <p className="font-medium">{exp.title}</p>
            {exp.company && <p className="text-sm">{exp.company}</p>}
            {(exp.start_date || exp.startDate || exp.end_date || exp.endDate) && (
              <p className="text-xs text-gray-500">
                {(exp.start_date || exp.startDate) && (exp.start_date || exp.startDate)}
                {(exp.start_date || exp.startDate) && (exp.end_date || exp.endDate) && ' - '}
                {(exp.end_date || exp.endDate) && (exp.end_date || exp.endDate)}
              </p>
            )}
            {exp.description && <p className="text-sm mt-1">{exp.description}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};
