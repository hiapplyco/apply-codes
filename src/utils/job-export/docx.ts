/**
 * Job Description Export — DOCX (Word) Format
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
  Header,
  Footer,
} from 'docx';
import { saveAs } from 'file-saver';
import { ClarvidaJobTemplate } from '@/types/organization';
import { generateFilename, formatSalary, getEnabledBenefits } from './helpers';

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
