/**
 * Job Description Export — Plain Text Format
 */

import { saveAs } from 'file-saver';
import { ClarvidaJobTemplate } from '@/types/organization';
import { generateFilename, formatSalary, getEnabledBenefits } from './helpers';

export function generatePlainText(template: Partial<ClarvidaJobTemplate>): string {
  const t = template;
  const salaryText = formatSalary(t);
  const benefits = getEnabledBenefits(t);
  const responsibilities = (t.responsibilities || []).filter(r => r?.trim());
  const licensure = (t.required_qualifications?.licensure || []).filter(l => l?.trim());
  const skills = (t.required_qualifications?.technical_skills || []).filter(s => s?.trim());

  return `${t.job_title || 'Position Title'}${t.specialty_credential ? ` - ${t.specialty_credential}` : ''}
${'='.repeat(60)}

Location: ${t.location?.city || 'City'}, ${t.location?.state || 'State'} (${t.location?.work_arrangement || 'On-site'})
Employment Type: ${t.employment_type || 'Full-time'}
Salary: ${salaryText}
Date Posted: ${new Date().toLocaleDateString()}

${'='.repeat(60)}
ABOUT THE ROLE
${'='.repeat(60)}

Clarvida is hiring a ${t.job_title || 'Position'} to join our ${t.about_role?.team_name || 'team'} in ${t.location?.city || 'our location'}, ${t.location?.state || ''}.

${t.about_role?.summary || ''}

${t.about_role?.primary_function || ''}

${t.about_role?.population_served ? `Population Served: ${t.about_role.population_served}` : ''}

${'='.repeat(60)}
RESPONSIBILITIES
${'='.repeat(60)}

${responsibilities.length > 0 ? responsibilities.map(r => `* ${r}`).join('\n') : '* Responsibilities to be determined'}

${'='.repeat(60)}
REQUIRED QUALIFICATIONS
${'='.repeat(60)}

${t.required_qualifications?.education ? `Education: ${t.required_qualifications.education}` : ''}
${licensure.length > 0 ? `Licensure: ${licensure.join(', ')}` : ''}
${t.required_qualifications?.experience_years ? `Experience: ${t.required_qualifications.experience_years}+ years` : ''}
${skills.length > 0 ? `Skills: ${skills.join(', ')}` : ''}

${'='.repeat(60)}
COMPENSATION & BENEFITS
${'='.repeat(60)}

Salary: ${salaryText}

${benefits.length > 0 ? benefits.map(b => `* ${b}`).join('\n') : '* Competitive benefits package'}

${'='.repeat(60)}
HOW TO APPLY
${'='.repeat(60)}

Apply online at www.clarvida.com/working-at-clarvida

${'='.repeat(60)}
ABOUT CLARVIDA
${'='.repeat(60)}

Clarvida is a trusted provider of behavioral health and human services.
With programs across multiple states, we deliver trauma-informed,
recovery-focused support to individuals and families in need.

Website: www.clarvida.com
Careers: www.clarvida.com/working-at-clarvida

${'='.repeat(60)}
EQUAL OPPORTUNITY EMPLOYER
${'='.repeat(60)}

Clarvida is an equal opportunity employer. All qualified applicants will
receive consideration without regard to race, color, religion, gender,
sexual orientation, gender identity, national origin, age, disability,
or veteran status.
`;
}

/**
 * Export to Plain Text file
 */
export function exportToText(template: Partial<ClarvidaJobTemplate>): void {
  const text = generatePlainText(template);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, generateFilename(template, 'txt'));
}
