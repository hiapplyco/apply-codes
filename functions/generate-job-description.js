const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getModel } = require('./utils/gemini');

/**
 * Generate a comprehensive job description using Gemini AI
 * Synthesizes form template data with uploaded context items
 */
exports.generateJobDescription = onCall(
  {
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const {
        template,
        contextItems = [],
        config = {}
      } = data;

      logger.info('[generateJobDescription] Request received:', {
        hasTemplate: !!template,
        contextItemsCount: contextItems.length,
        config
      });

      if (!template) {
        throw new HttpsError('invalid-argument', 'Template data is required');
      }

      const model = getModel();
      if (!model) {
        throw new HttpsError('failed-precondition', 'GEMINI_API_KEY not configured');
      }

      // Build context from uploaded items
      const contextSummary = buildContextSummary(contextItems);

      // Build template data summary
      const templateSummary = buildTemplateSummary(template);

      // Build the benefits list
      const benefitsList = buildBenefitsList(template.benefits);

      const prompt = `You are an expert HR professional and job description writer for Clarvida, a leading behavioral health and human services provider. Create a compelling, comprehensive, and professionally formatted job description.

## YOUR ROLE
- Synthesize ALL provided information into a cohesive narrative
- Enhance thin descriptions with industry-appropriate language
- Use inclusive, gender-neutral language throughout
- Focus on impact, growth opportunities, and Clarvida's mission
- Write responsibilities as action-oriented statements with measurable outcomes

## STRUCTURED TEMPLATE DATA (Primary Source)
${templateSummary}

${contextSummary ? `## ADDITIONAL CONTEXT FROM DOCUMENTS/SOURCES
The following information was extracted from uploaded documents, URLs, or research. Synthesize relevant insights into your job description:

${contextSummary}

IMPORTANT: Use insights from this context to:
- Enrich responsibility descriptions
- Add industry-specific terminology
- Include relevant qualifications mentioned
- Enhance the role narrative with real-world context
` : ''}

## BENEFITS TO INCLUDE
${benefitsList || 'Standard benefits package'}

## OUTPUT REQUIREMENTS

Create a complete job description with these sections IN THIS ORDER:

1. **Header** - Job title (with specialty if applicable), location, employment type, salary range, date posted

2. **About the Role** - 2-3 paragraphs that:
   - Open with Clarvida's mission and this role's importance
   - Describe the day-to-day impact
   - Mention team/program context
   - Highlight population served and care philosophy

3. **Key Responsibilities** - 5-10 bullet points that:
   - Start with strong action verbs
   - Include measurable outcomes where possible
   - Cover clinical, administrative, and collaborative duties
   - Reflect Clarvida's trauma-informed, person-centered approach

4. **Required Qualifications** - Organized subsections for:
   - Education requirements
   - Licensure/Certification (specific to role)
   - Experience level
   - Technical/Clinical skills
   - Other requirements

5. **Compensation & Benefits** - Include:
   - Salary range (formatted appropriately)
   - List of benefits (use the provided benefits)
   - Highlight unique perks

6. **About Clarvida** - Brief company overview emphasizing:
   - Behavioral health and human services mission
   - Person-centered, trauma-informed care model
   - Growth and professional development culture
   - Supportive team environment

7. **Equal Opportunity Statement** - Standard inclusive EEO statement

8. **Fraud Alert** - Brief warning about job offer scams

9. **Keywords** - SEO-optimized keywords for job board visibility

## FORMATTING
- Use Markdown with proper headers (# ## ###)
- Use bullet points for lists
- Bold key terms and requirements
- Keep paragraphs concise and scannable
- Professional but approachable tone

## OUTPUT
Return ONLY the complete job description in Markdown format. No explanations, no JSON wrapper, no additional commentary.`;

      logger.info('[generateJobDescription] Generating with Gemini...');

      const result = await model.generateContent(prompt);
      const description = result.response.text().trim();

      if (!description) {
        throw new Error('Empty response from Gemini');
      }

      logger.info('[generateJobDescription] Generated:', {
        length: description.length,
        hasContextItems: contextItems.length > 0
      });

      return {
        success: true,
        description,
        metadata: {
          generatedAt: new Date().toISOString(),
          contextItemsUsed: contextItems.length,
          model: 'gemini-3.1-pro-preview'
        }
      };

    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('[generateJobDescription] Error:', error);
      throw new HttpsError('internal', error.message || 'Failed to generate job description');
    }
  }
);

/**
 * Build a summary of template data for the prompt
 */
function buildTemplateSummary(template) {
  const t = template;
  const parts = [];

  // Basic info
  parts.push(`**Job Title:** ${t.job_title || '[Not specified]'}`);
  if (t.specialty_credential) {
    parts.push(`**Specialty/Credential:** ${t.specialty_credential}`);
  }

  // Location
  if (t.location) {
    const loc = t.location;
    parts.push(`**Location:** ${loc.city || '[City]'}, ${loc.state || '[State]'} (${loc.work_arrangement || 'On-site'})`);
  }

  parts.push(`**Employment Type:** ${t.employment_type || 'Full-time'}`);

  // Salary
  if (t.salary) {
    const sal = t.salary;
    if (sal.type === 'hourly') {
      parts.push(`**Salary:** $${sal.min?.toFixed(2) || '0.00'}/hour${sal.max ? ` - $${sal.max.toFixed(2)}/hour` : ''}`);
    } else {
      parts.push(`**Salary:** $${(sal.min || 0).toLocaleString()}/year${sal.max ? ` - $${sal.max.toLocaleString()}/year` : ''}`);
    }
  }

  // About role
  if (t.about_role) {
    const ar = t.about_role;
    if (ar.team_name) parts.push(`**Team/Program:** ${ar.team_name}`);
    if (ar.summary) parts.push(`**Role Summary:** ${ar.summary}`);
    if (ar.primary_function) parts.push(`**Primary Function:** ${ar.primary_function}`);
    if (ar.population_served) parts.push(`**Population Served:** ${ar.population_served}`);
  }

  // Responsibilities
  const responsibilities = (t.responsibilities || []).filter(r => r && r.trim());
  if (responsibilities.length > 0) {
    parts.push(`**Responsibilities:**\n${responsibilities.map(r => `- ${r}`).join('\n')}`);
  }

  // Qualifications
  if (t.required_qualifications) {
    const rq = t.required_qualifications;
    if (rq.education) parts.push(`**Education:** ${rq.education}`);

    const licensure = (rq.licensure || []).filter(l => l && l.trim());
    if (licensure.length > 0) {
      parts.push(`**Licensure/Certification:** ${licensure.join(', ')}`);
    }

    if (rq.experience_years) {
      parts.push(`**Experience Required:** ${rq.experience_years}+ years`);
    }

    const skills = (rq.technical_skills || []).filter(s => s && s.trim());
    if (skills.length > 0) {
      parts.push(`**Technical/Clinical Skills:** ${skills.join(', ')}`);
    }

    const other = (rq.other_requirements || []).filter(o => o && o.trim());
    if (other.length > 0) {
      parts.push(`**Other Requirements:**\n${other.map(o => `- ${o}`).join('\n')}`);
    }
  }

  // Keywords
  const keywords = (t.seo_keywords || []).filter(k => k && k.trim());
  if (keywords.length > 0) {
    parts.push(`**SEO Keywords:** ${keywords.join(', ')}`);
  }

  return parts.join('\n\n');
}

/**
 * Build a summary of context items for the prompt
 */
function buildContextSummary(contextItems) {
  if (!contextItems || contextItems.length === 0) {
    return '';
  }

  const summaries = contextItems.map((item, index) => {
    const parts = [];
    parts.push(`### Context Source ${index + 1}: ${item.title || 'Untitled'}`);
    parts.push(`**Type:** ${formatContextType(item.type)}`);

    if (item.source_url) {
      parts.push(`**Source:** ${item.source_url}`);
    }

    if (item.summary) {
      parts.push(`**Summary:** ${item.summary}`);
    }

    if (item.content) {
      const content = item.content.length > 2000
        ? item.content.substring(0, 2000) + '...[truncated]'
        : item.content;
      parts.push(`**Content:**\n${content}`);
    }

    if (item.metadata?.extractedJobData) {
      const extracted = item.metadata.extractedJobData;
      const extractedFields = Object.entries(extracted)
        .filter(([_, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `- ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join('\n');

      if (extractedFields) {
        parts.push(`**Extracted Data:**\n${extractedFields}`);
      }
    }

    return parts.join('\n');
  });

  return summaries.join('\n\n---\n\n');
}

/**
 * Format context type for display
 */
function formatContextType(type) {
  const typeMap = {
    'file_upload': 'Uploaded Document',
    'url_scrape': 'Web Page',
    'perplexity_search': 'AI Research',
    'manual_input': 'Manual Entry',
    'location_input': 'Location Data'
  };
  return typeMap[type] || type;
}

/**
 * Build benefits list from template
 */
function buildBenefitsList(benefits) {
  if (!benefits) return '';

  const benefitLabels = {
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
    perks_program: 'Perks @ Clarvida - Verizon discounts, entertainment deals & more'
  };

  const enabledBenefits = Object.entries(benefits)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => benefitLabels[key])
    .filter(Boolean);

  return enabledBenefits.length > 0
    ? enabledBenefits.map(b => `- ${b}`).join('\n')
    : '';
}
