// Organization types for multi-tenant support

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  members: Record<string, OrgRole>;
  branding: {
    logo_url: string;
    primary_color: string;
    secondary_color?: string;
    name: string;
  };
  settings: {
    allowed_domains?: string[];
    require_approval: boolean;
    invite_only: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface UserOrganization {
  id?: string;
  user_id: string;
  organization_id: string;
  role: OrgRole;
  joined_at: string;
  invited_by?: string;
}

export interface OrganizationInvite {
  id?: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
}

// Clarvida-specific job template structure
export interface ClarvidaJobTemplate {
  job_title: string;
  specialty_credential?: string;
  location: {
    city: string;
    state: string;
    work_arrangement: 'On-site' | 'Hybrid' | 'Remote' | 'Community-Based';
  };
  employment_type: 'Full-time' | 'Part-time' | 'Contract';
  salary: {
    type: 'hourly' | 'annual';
    min: number;
    max: number;
  };
  date_posted?: string;
  about_role: {
    team_name?: string;
    summary: string;
    primary_function: string;
    population_served?: string;
  };
  responsibilities: string[];
  required_qualifications: {
    education?: string;
    licensure?: string[];
    experience_years?: number;
    technical_skills?: string[];
    other_requirements?: string[];
  };
  benefits: {
    daily_pay: boolean;
    paid_vacation: boolean;
    sick_leave: boolean;
    paid_holidays: boolean;
    medical_dental_vision: boolean;
    hsa_fsa: boolean;
    retirement_401k: boolean;
    licensure_supervision: boolean;
    ceu_opportunities: boolean;
    mileage_reimbursement: boolean;
    cellphone_stipend: boolean;
    eap: boolean;
    pet_insurance: boolean;
    perks_program: boolean;
  };
  seo_keywords?: string[];
}

export interface JobTemplate {
  id?: string;
  organization_id: string;
  name: string;
  template_data: Partial<ClarvidaJobTemplate>;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

// Permission helpers
export const ORG_PERMISSIONS = {
  owner: ['manage_org', 'manage_members', 'manage_billing', 'create_project', 'edit_project', 'delete_project', 'view_project'],
  admin: ['manage_members', 'create_project', 'edit_project', 'delete_project', 'view_project'],
  member: ['create_project', 'edit_project', 'view_project'],
  viewer: ['view_project']
} as const;

export type OrgPermission = typeof ORG_PERMISSIONS[OrgRole][number];

export function hasPermission(role: OrgRole | null, permission: OrgPermission): boolean {
  if (!role) return false;
  return (ORG_PERMISSIONS[role] as readonly string[]).includes(permission);
}
