/**
 * Job Description Export — PDF Format
 */

import { jsPDF } from 'jspdf';
import { ClarvidaJobTemplate } from '@/types/organization';
import { generateFilename, formatSalary, getEnabledBenefits } from './helpers';

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
