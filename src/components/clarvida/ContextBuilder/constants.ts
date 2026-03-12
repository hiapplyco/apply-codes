export const DEFAULT_BENEFITS = {
  daily_pay: true,
  paid_vacation: true,
  sick_leave: true,
  paid_holidays: true,
  medical_dental_vision: true,
  hsa_fsa: true,
  retirement_401k: true,
  licensure_supervision: true,
  ceu_opportunities: true,
  mileage_reimbursement: false,
  cellphone_stipend: false,
  eap: true,
  pet_insurance: false,
  perks_program: true,
};

export const BENEFIT_LABELS: Record<keyof typeof DEFAULT_BENEFITS, string> = {
  daily_pay: 'DailyPay - Access your earnings early',
  paid_vacation: 'Paid vacation days (increases with tenure)',
  sick_leave: 'Separate sick leave (rolls over annually)',
  paid_holidays: 'Up to 10 paid holidays (varies by region)',
  medical_dental_vision: 'Medical, dental, vision insurance',
  hsa_fsa: 'HSA & FSA options',
  retirement_401k: '401(k) with employer match',
  licensure_supervision: 'Free licensure supervision + CEU opportunities',
  ceu_opportunities: 'CEU opportunities',
  mileage_reimbursement: 'Mileage reimbursement',
  cellphone_stipend: 'Cellphone stipend',
  eap: 'Employee Assistance Program (EAP)',
  pet_insurance: 'Pet insurance',
  perks_program: 'Perks @ Clarvida - Verizon discounts, entertainment deals & more',
};

export const SECTION_INSTRUCTIONS: Record<string, string> = {
  context: 'Step 1: Upload documents, paste URLs, or enter text to auto-fill the form with AI extraction.',
  basic: 'Step 2: Fill in the basic job information. Fields marked with * are recommended.',
  about: 'Step 2: Describe the role and team. This information appears in the job posting.',
  responsibilities: 'Step 3: List the key responsibilities. Add more items with the + button.',
  qualifications: 'Step 3: Specify required qualifications, skills, and experience.',
  benefits: 'Optional: Toggle the benefits offered with this position.',
  keywords: 'Optional: Add SEO keywords to improve job visibility in searches.',
};
