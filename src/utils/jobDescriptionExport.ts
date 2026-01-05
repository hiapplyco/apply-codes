/**
 * Job Description Export Utility
 *
 * Exports ClarvidaJobTemplate data to multiple formats:
 * - .docx (Word document with proper formatting)
 * - .pdf (PDF with Clarvida branding)
 * - .md (Markdown)
 * - .txt (Plain text)
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Packer,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from 'docx';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { ClarvidaJobTemplate } from '@/types/organization';

// Clarvida brand colors
const CLARVIDA_PURPLE = '#7C3AED';
const CLARVIDA_DARK = '#1F2937';

// Benefit labels mapping
const BENEFIT_LABELS: Record<string, string> = {
  daily_pay: 'DailyPay - Access your earnings early',
  paid_vacation: 'Paid vacation days (increases with tenure)',
  sick_leave: 'Separate sick leave (rolls over annually)',
  paid_holidays: 'Up to 10 paid holidays (varies by region)',
  medical_dental_vision: 'Medical, dental, and vision insurance',
  hsa_fsa: 'HSA & FSA options',
  retirement_401k: '401(k) with employer match',
  licensure_supervision: 'Free licensure supervision',
  ceu_opportunities: 'CEU opportunities',
  mileage_reimbursement: 'Mileage reimbursement',
  cellphone_stipend: 'Cellphone stipend',
  eap: 'Employee Assistance Program (EAP)',
  pet_insurance: 'Pet insurance',
  perks_program: 'Perks @ Clarvida - discounts & deals',
};

/**
 * Generate a safe filename from job title
 */
function generateFilename(template: Partial<ClarvidaJobTemplate>, extension: string): string {
  const title = template.job_title || 'Job Description';
  const location = template.location?.city || '';
  const safeName = `${title}${location ? ` - ${location}` : ''}`
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  return `${safeName}.${extension}`;
}

/**
 * Format salary display
 */
function formatSalary(template: Partial<ClarvidaJobTemplate>): string {
  if (!template.salary) return 'Competitive';

  const { type, min, max } = template.salary;
  if (type === 'hourly') {
    return `$${min?.toFixed(2) || '0.00'}/hour${max ? ` - $${max.toFixed(2)}/hour` : ''}`;
  }
  return `$${(min || 0).toLocaleString()}/year${max ? ` - $${max.toLocaleString()}/year` : ''}`;
}

/**
 * Get enabled benefits list
 */
function getEnabledBenefits(template: Partial<ClarvidaJobTemplate>): string[] {
  if (!template.benefits) return [];

  return Object.entries(template.benefits)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => BENEFIT_LABELS[key] || key)
    .filter(Boolean);
}

// =============================================================================
// MARKDOWN EXPORT
// =============================================================================

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

// =============================================================================
// PLAIN TEXT EXPORT
// =============================================================================

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

// =============================================================================
// DOCX (WORD) EXPORT
// =============================================================================

export async function exportToDocx(template: Partial<ClarvidaJobTemplate>): Promise<void> {
  const t = template;
  const salaryText = formatSalary(t);
  const benefits = getEnabledBenefits(t);
  const responsibilities = (t.responsibilities || []).filter(r => r?.trim());
  const licensure = (t.required_qualifications?.licensure || []).filter(l => l?.trim());
  const skills = (t.required_qualifications?.technical_skills || []).filter(s => s?.trim());
  const otherReqs = (t.required_qualifications?.other_requirements || []).filter(r => r?.trim());

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: 'Calibri',
            size: 22, // 11pt
          },
          paragraph: {
            spacing: { after: 120 },
          },
        },
        {
          id: 'Title',
          name: 'Title',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: 'Calibri',
            size: 48, // 24pt
            bold: true,
            color: '7C3AED',
          },
          paragraph: {
            spacing: { after: 200 },
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'CLARVIDA',
                    bold: true,
                    size: 28,
                    color: '7C3AED',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    text: '  |  Behavioral Health & Human Services',
                    size: 20,
                    color: '6B7280',
                    font: 'Calibri',
                  }),
                ],
                alignment: AlignmentType.LEFT,
                border: {
                  bottom: {
                    color: '7C3AED',
                    space: 1,
                    size: 6,
                    style: BorderStyle.SINGLE,
                  },
                },
                spacing: { after: 200 },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'www.clarvida.com  |  Equal Opportunity Employer',
                    size: 18,
                    color: '9CA3AF',
                    font: 'Calibri',
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: `${t.job_title || 'Position Title'}${t.specialty_credential ? ` - ${t.specialty_credential}` : ''}`,
                bold: true,
                size: 48,
                color: '7C3AED',
                font: 'Calibri',
              }),
            ],
            spacing: { after: 200 },
          }),

          // Job details table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [
                        new TextRun({ text: 'Location: ', bold: true, font: 'Calibri', size: 22 }),
                        new TextRun({ text: `${t.location?.city || 'City'}, ${t.location?.state || 'State'} (${t.location?.work_arrangement || 'On-site'})`, font: 'Calibri', size: 22 }),
                      ],
                    })],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [
                        new TextRun({ text: 'Employment Type: ', bold: true, font: 'Calibri', size: 22 }),
                        new TextRun({ text: t.employment_type || 'Full-time', font: 'Calibri', size: 22 }),
                      ],
                    })],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [
                        new TextRun({ text: 'Salary: ', bold: true, font: 'Calibri', size: 22 }),
                        new TextRun({ text: salaryText, font: 'Calibri', size: 22 }),
                      ],
                    })],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [
                        new TextRun({ text: 'Date Posted: ', bold: true, font: 'Calibri', size: 22 }),
                        new TextRun({ text: new Date().toLocaleDateString(), font: 'Calibri', size: 22 }),
                      ],
                    })],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
          }),

          // Spacer
          new Paragraph({ spacing: { after: 300 } }),

          // About the Role
          new Paragraph({
            text: 'About the Role',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            border: {
              bottom: {
                color: 'E5E7EB',
                space: 1,
                size: 6,
                style: BorderStyle.SINGLE,
              },
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Clarvida is hiring a ${t.job_title || 'Position'} to join our ${t.about_role?.team_name || 'team'} in ${t.location?.city || 'our location'}, ${t.location?.state || ''}. This ${t.employment_type?.toLowerCase() || 'full-time'} role offers competitive pay, growth opportunities, and comprehensive benefits.`,
                font: 'Calibri',
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          ...(t.about_role?.summary ? [
            new Paragraph({
              text: t.about_role.summary,
              spacing: { after: 200 },
            }),
          ] : []),

          ...(t.about_role?.primary_function ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `As a ${t.job_title || 'team member'}, you will ${t.about_role.primary_function}`,
                  font: 'Calibri',
                  size: 22,
                }),
                ...(t.about_role?.population_served ? [
                  new TextRun({
                    text: ` You'll work with ${t.about_role.population_served}.`,
                    font: 'Calibri',
                    size: 22,
                  }),
                ] : []),
              ],
              spacing: { after: 200 },
            }),
          ] : []),

          // Responsibilities
          new Paragraph({
            text: 'Responsibilities',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            border: {
              bottom: {
                color: 'E5E7EB',
                space: 1,
                size: 6,
                style: BorderStyle.SINGLE,
              },
            },
          }),

          ...responsibilities.map(resp =>
            new Paragraph({
              children: [
                new TextRun({ text: '• ', font: 'Calibri', size: 22 }),
                new TextRun({ text: resp, font: 'Calibri', size: 22 }),
              ],
              spacing: { after: 100 },
              indent: { left: 360 },
            })
          ),

          // Required Qualifications
          new Paragraph({
            text: 'Required Qualifications',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            border: {
              bottom: {
                color: 'E5E7EB',
                space: 1,
                size: 6,
                style: BorderStyle.SINGLE,
              },
            },
          }),

          ...(t.required_qualifications?.education ? [
            new Paragraph({
              children: [
                new TextRun({ text: 'Education: ', bold: true, font: 'Calibri', size: 22 }),
                new TextRun({ text: t.required_qualifications.education, font: 'Calibri', size: 22 }),
              ],
              spacing: { after: 100 },
            }),
          ] : []),

          ...(licensure.length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({ text: 'Licensure/Certification: ', bold: true, font: 'Calibri', size: 22 }),
                new TextRun({ text: licensure.join(', '), font: 'Calibri', size: 22 }),
              ],
              spacing: { after: 100 },
            }),
          ] : []),

          ...(t.required_qualifications?.experience_years ? [
            new Paragraph({
              children: [
                new TextRun({ text: 'Experience: ', bold: true, font: 'Calibri', size: 22 }),
                new TextRun({ text: `${t.required_qualifications.experience_years}+ years`, font: 'Calibri', size: 22 }),
              ],
              spacing: { after: 100 },
            }),
          ] : []),

          ...(skills.length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({ text: 'Technical Skills: ', bold: true, font: 'Calibri', size: 22 }),
                new TextRun({ text: skills.join(', '), font: 'Calibri', size: 22 }),
              ],
              spacing: { after: 100 },
            }),
          ] : []),

          // Compensation & Benefits
          new Paragraph({
            text: 'Compensation & Benefits',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            border: {
              bottom: {
                color: 'E5E7EB',
                space: 1,
                size: 6,
                style: BorderStyle.SINGLE,
              },
            },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Salary: ', bold: true, font: 'Calibri', size: 22 }),
              new TextRun({ text: salaryText, font: 'Calibri', size: 22 }),
            ],
            spacing: { after: 200 },
          }),

          ...benefits.map(benefit =>
            new Paragraph({
              children: [
                new TextRun({ text: '• ', font: 'Calibri', size: 22 }),
                new TextRun({ text: benefit, font: 'Calibri', size: 22 }),
              ],
              spacing: { after: 80 },
              indent: { left: 360 },
            })
          ),

          // About Clarvida
          new Paragraph({
            text: 'About Clarvida',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            border: {
              bottom: {
                color: 'E5E7EB',
                space: 1,
                size: 6,
                style: BorderStyle.SINGLE,
              },
            },
          }),

          new Paragraph({
            text: 'Clarvida is a trusted provider of behavioral health and human services. With programs across multiple states, we deliver trauma-informed, recovery-focused support to individuals and families in need. We are committed to cultural responsiveness, equity, and evidence-based care that improves lives and strengthens communities.',
            spacing: { after: 200 },
          }),

          // How to Apply
          new Paragraph({
            text: 'How to Apply',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            border: {
              bottom: {
                color: 'E5E7EB',
                space: 1,
                size: 6,
                style: BorderStyle.SINGLE,
              },
            },
          }),

          new Paragraph({
            text: 'If you\'re passionate about behavioral health and making a difference in people\'s lives, we encourage you to apply. Click "Apply Now" to join a dedicated team that values growth, compassion, and community impact.',
            spacing: { after: 200 },
          }),

          // Equal Opportunity
          new Paragraph({
            spacing: { before: 400 },
            children: [
              new TextRun({
                text: 'Equal Opportunity Employer: ',
                bold: true,
                italics: true,
                font: 'Calibri',
                size: 20,
                color: '6B7280',
              }),
              new TextRun({
                text: 'Clarvida is an equal opportunity employer. All qualified applicants will receive consideration without regard to race, color, religion, gender, sexual orientation, gender identity, national origin, age, disability, or veteran status.',
                italics: true,
                font: 'Calibri',
                size: 20,
                color: '6B7280',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, generateFilename(template, 'docx'));
}

// =============================================================================
// PDF EXPORT
// =============================================================================

export async function exportToPdf(template: Partial<ClarvidaJobTemplate>): Promise<void> {
  const t = template;
  const salaryText = formatSalary(t);
  const benefits = getEnabledBenefits(t);
  const responsibilities = (t.responsibilities || []).filter(r => r?.trim());
  const licensure = (t.required_qualifications?.licensure || []).filter(l => l?.trim());
  const skills = (t.required_qualifications?.technical_skills || []).filter(s => s?.trim());

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper function for wrapped text
  const addWrappedText = (text: string, x: number, startY: number, maxWidth: number, lineHeight: number): number => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, startY);
    return startY + lines.length * lineHeight;
  };

  // Helper to check page break
  const checkPageBreak = (neededSpace: number): number => {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      // Add header to new page
      doc.setFontSize(10);
      doc.setTextColor(124, 58, 237);
      doc.setFont('helvetica', 'bold');
      doc.text('CLARVIDA', margin, y);
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      doc.text('  |  Behavioral Health & Human Services', margin + 25, y);
      doc.setDrawColor(124, 58, 237);
      doc.line(margin, y + 3, pageWidth - margin, y + 3);
      y += 15;
    }
    return y;
  };

  // ==========================================================================
  // HEADER WITH PURPLE ACCENT BAR
  // ==========================================================================

  // Purple accent bar at top
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, pageWidth, 8, 'F');

  y = 20;

  // Clarvida logo/text
  doc.setFontSize(16);
  doc.setTextColor(124, 58, 237);
  doc.setFont('helvetica', 'bold');
  doc.text('CLARVIDA', margin, y);

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('Behavioral Health & Human Services', margin + 32, y);

  y += 5;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // ==========================================================================
  // JOB TITLE
  // ==========================================================================

  doc.setFontSize(24);
  doc.setTextColor(124, 58, 237);
  doc.setFont('helvetica', 'bold');
  const title = `${t.job_title || 'Position Title'}${t.specialty_credential ? ` - ${t.specialty_credential}` : ''}`;
  y = addWrappedText(title, margin, y, contentWidth, 10);
  y += 8;

  // ==========================================================================
  // JOB DETAILS BOX
  // ==========================================================================

  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F');

  const boxY = y + 7;
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text('Location:', margin + 5, boxY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${t.location?.city || 'City'}, ${t.location?.state || 'State'} (${t.location?.work_arrangement || 'On-site'})`, margin + 25, boxY);

  doc.setFont('helvetica', 'bold');
  doc.text('Type:', margin + 100, boxY);
  doc.setFont('helvetica', 'normal');
  doc.text(t.employment_type || 'Full-time', margin + 112, boxY);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('Salary:', margin + 5, boxY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(salaryText, margin + 22, boxY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('Posted:', margin + 100, boxY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString(), margin + 118, boxY + 10);

  y += 35;

  // ==========================================================================
  // ABOUT THE ROLE
  // ==========================================================================

  y = checkPageBreak(40);

  doc.setFontSize(14);
  doc.setTextColor(124, 58, 237);
  doc.setFont('helvetica', 'bold');
  doc.text('About the Role', margin, y);
  y += 2;
  doc.setDrawColor(124, 58, 237);
  doc.line(margin, y, margin + 35, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'normal');

  const aboutIntro = `Clarvida is hiring a ${t.job_title || 'Position'} to join our ${t.about_role?.team_name || 'team'} in ${t.location?.city || 'our location'}, ${t.location?.state || ''}. This ${t.employment_type?.toLowerCase() || 'full-time'} role offers competitive pay, growth opportunities, and comprehensive benefits.`;
  y = addWrappedText(aboutIntro, margin, y, contentWidth, 5);
  y += 5;

  if (t.about_role?.summary) {
    y = addWrappedText(t.about_role.summary, margin, y, contentWidth, 5);
    y += 5;
  }

  if (t.about_role?.primary_function) {
    const funcText = `As a ${t.job_title || 'team member'}, you will ${t.about_role.primary_function}${t.about_role?.population_served ? ` You'll work with ${t.about_role.population_served}.` : ''}`;
    y = addWrappedText(funcText, margin, y, contentWidth, 5);
  }
  y += 10;

  // ==========================================================================
  // RESPONSIBILITIES
  // ==========================================================================

  y = checkPageBreak(30 + responsibilities.length * 6);

  doc.setFontSize(14);
  doc.setTextColor(124, 58, 237);
  doc.setFont('helvetica', 'bold');
  doc.text('Responsibilities', margin, y);
  y += 2;
  doc.setDrawColor(124, 58, 237);
  doc.line(margin, y, margin + 38, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'normal');

  for (const resp of responsibilities) {
    y = checkPageBreak(10);
    doc.setFillColor(124, 58, 237);
    doc.circle(margin + 2, y - 1.5, 1, 'F');
    y = addWrappedText(resp, margin + 7, y, contentWidth - 7, 5);
    y += 2;
  }
  y += 5;

  // ==========================================================================
  // REQUIRED QUALIFICATIONS
  // ==========================================================================

  y = checkPageBreak(40);

  doc.setFontSize(14);
  doc.setTextColor(124, 58, 237);
  doc.setFont('helvetica', 'bold');
  doc.text('Required Qualifications', margin, y);
  y += 2;
  doc.setDrawColor(124, 58, 237);
  doc.line(margin, y, margin + 52, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);

  if (t.required_qualifications?.education) {
    doc.setFont('helvetica', 'bold');
    doc.text('Education:', margin, y);
    doc.setFont('helvetica', 'normal');
    y = addWrappedText(t.required_qualifications.education, margin + 25, y, contentWidth - 25, 5);
    y += 3;
  }

  if (licensure.length > 0) {
    y = checkPageBreak(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Licensure:', margin, y);
    doc.setFont('helvetica', 'normal');
    y = addWrappedText(licensure.join(', '), margin + 25, y, contentWidth - 25, 5);
    y += 3;
  }

  if (t.required_qualifications?.experience_years) {
    y = checkPageBreak(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Experience:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t.required_qualifications.experience_years}+ years`, margin + 27, y);
    y += 7;
  }

  if (skills.length > 0) {
    y = checkPageBreak(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Skills:', margin, y);
    doc.setFont('helvetica', 'normal');
    y = addWrappedText(skills.join(', '), margin + 17, y, contentWidth - 17, 5);
  }
  y += 10;

  // ==========================================================================
  // COMPENSATION & BENEFITS
  // ==========================================================================

  y = checkPageBreak(30 + benefits.length * 6);

  doc.setFontSize(14);
  doc.setTextColor(124, 58, 237);
  doc.setFont('helvetica', 'bold');
  doc.text('Compensation & Benefits', margin, y);
  y += 2;
  doc.setDrawColor(124, 58, 237);
  doc.line(margin, y, margin + 55, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'bold');
  doc.text('Salary:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(salaryText, margin + 17, y);
  y += 8;

  for (const benefit of benefits) {
    y = checkPageBreak(8);
    doc.setFillColor(16, 185, 129); // Green dot for benefits
    doc.circle(margin + 2, y - 1.5, 1, 'F');
    y = addWrappedText(benefit, margin + 7, y, contentWidth - 7, 5);
    y += 2;
  }
  y += 10;

  // ==========================================================================
  // FOOTER
  // ==========================================================================

  // Add footer to each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'normal');
    doc.text('www.clarvida.com  |  Equal Opportunity Employer', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  // Save
  doc.save(generateFilename(template, 'pdf'));
}

// =============================================================================
// MAIN EXPORT CLASS
// =============================================================================

export class JobDescriptionExporter {
  /**
   * Export to all formats
   */
  static async exportAll(template: Partial<ClarvidaJobTemplate>): Promise<void> {
    await Promise.all([
      exportToDocx(template),
      exportToPdf(template),
    ]);
    exportToMarkdown(template);
    exportToText(template);
  }

  /**
   * Export to specific format
   */
  static async export(
    template: Partial<ClarvidaJobTemplate>,
    format: 'docx' | 'pdf' | 'md' | 'txt'
  ): Promise<void> {
    switch (format) {
      case 'docx':
        await exportToDocx(template);
        break;
      case 'pdf':
        await exportToPdf(template);
        break;
      case 'md':
        exportToMarkdown(template);
        break;
      case 'txt':
        exportToText(template);
        break;
    }
  }

  /**
   * Get markdown preview (for display)
   */
  static getMarkdownPreview(template: Partial<ClarvidaJobTemplate>): string {
    return generateMarkdown(template);
  }

  /**
   * Get plain text preview
   */
  static getPlainTextPreview(template: Partial<ClarvidaJobTemplate>): string {
    return generatePlainText(template);
  }
}

export default JobDescriptionExporter;
