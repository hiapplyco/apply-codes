/**
 * Job Description Export — Markdown Format
 */

import { saveAs } from 'file-saver';
import { ClarvidaJobTemplate } from '@/types/organization';
import { generateFilename, formatSalary, getEnabledBenefits } from './helpers';

export function generateMarkdown(template: Partial<ClarvidaJobTemplate>): string {
  const t = template;
  const salaryText = formatSalary(t);
  const benefits = getEnabledBenefits(t);
  const responsibilities = (t.responsibilities || []).filter(r => r?.trim());
  const licensure = (t.required_qualifications?.licensure || []).filter(l => l?.trim());
  const skills = (t.required_qualifications?.technical_skills || []).filter(s => s?.trim());
  const otherReqs = (t.required_qualifications?.other_requirements || []).filter(r => r?.trim());

  return `# ${t.job_title || 'Position Title'}${t.specialty_credential ? ` - ${t.specialty_credential}` : ''}

**Location:** ${t.location?.city || 'City'}, ${t.location?.state || 'State'} (${t.location?.work_arrangement || 'On-site'})
**Employment Type:** ${t.employment_type || 'Full-time'}
**Salary:** ${salaryText}
**Date Posted:** ${new Date().toLocaleDateString()}

---

## About the Role

Clarvida is hiring a ${t.job_title || 'Position'} to join our ${t.about_role?.team_name || 'team'} in ${t.location?.city || 'our location'}, ${t.location?.state || ''}. This ${t.employment_type?.toLowerCase() || 'full-time'} role offers competitive pay, growth opportunities, and comprehensive benefits.

${t.about_role?.summary || ''}

${t.about_role?.primary_function ? `As a ${t.job_title || 'team member'}, you will ${t.about_role.primary_function}` : ''}${t.about_role?.population_served ? ` You'll work with ${t.about_role.population_served}.` : ''}

---

## Responsibilities

${responsibilities.length > 0 ? responsibilities.map(r => `- ${r}`).join('\n') : '- Responsibilities to be determined'}

---

## Required Qualifications

${t.required_qualifications?.education ? `- **Education:** ${t.required_qualifications.education}` : ''}
${licensure.length > 0 ? `- **Licensure/Certification:** ${licensure.join(', ')}` : ''}
${t.required_qualifications?.experience_years ? `- **Experience:** ${t.required_qualifications.experience_years}+ years` : ''}
${skills.length > 0 ? `- **Technical Skills:** ${skills.join(', ')}` : ''}
${otherReqs.length > 0 ? otherReqs.map(r => `- ${r}`).join('\n') : ''}

---

## Compensation & Benefits

**Salary:** ${salaryText}

${benefits.length > 0 ? benefits.map(b => `- ${b}`).join('\n') : '- Competitive benefits package'}

---

## Work Location

${t.location?.city || 'City'}, ${t.location?.state || 'State'} - ${t.location?.work_arrangement || 'On-site'}

---

## How to Apply

If you're passionate about behavioral health and making a difference in people's lives, we encourage you to apply. Click "Apply Now" to join a dedicated team that values growth, compassion, and community impact.

---

## About Clarvida

Clarvida is a trusted provider of behavioral health and human services. With programs across multiple states, we deliver trauma-informed, recovery-focused support to individuals and families in need.

**Learn more:** [www.clarvida.com/mission-vision-and-values](https://www.clarvida.com/mission-vision-and-values)
**Explore opportunities:** [www.clarvida.com/working-at-clarvida](https://www.clarvida.com/working-at-clarvida)

---

## Equal Opportunity Employer

Clarvida is an equal opportunity employer. All qualified applicants will receive consideration without regard to race, color, religion, gender, sexual orientation, gender identity, national origin, age, disability, or veteran status.

${t.seo_keywords?.length ? `\n---\n\n**Keywords:** ${t.seo_keywords.join(', ')}` : ''}
`;
}

/**
 * Export to Markdown file
 */
export function exportToMarkdown(template: Partial<ClarvidaJobTemplate>): void {
  const markdown = generateMarkdown(template);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, generateFilename(template, 'md'));
}
