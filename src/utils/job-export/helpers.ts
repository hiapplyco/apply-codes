/**
 * Job Description Export — Shared Helpers
 *
 * Brand colors, benefit labels, and utility functions used by all export formats.
 */

import { ClarvidaJobTemplate } from '@/types/organization';

// Clarvida brand colors
export const CLARVIDA_PURPLE = '#7C3AED';
export const CLARVIDA_DARK = '#1F2937';

// Benefit labels mapping
export const BENEFIT_LABELS: Record<string, string> = {
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
export function generateFilename(template: Partial<ClarvidaJobTemplate>, extension: string): string {
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
export function formatSalary(template: Partial<ClarvidaJobTemplate>): string {
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
export function getEnabledBenefits(template: Partial<ClarvidaJobTemplate>): string[] {
  if (!template.benefits) return [];

  return Object.entries(template.benefits)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => BENEFIT_LABELS[key] || key)
    .filter(Boolean);
}
