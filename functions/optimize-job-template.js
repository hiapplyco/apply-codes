const { onRequest } = require('firebase-functions/v2/https');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('firebase-functions/logger');

/**
 * Gemini-powered job template optimization
 *
 * This function acts as an intelligent merge/optimization layer that:
 * 1. Deduplicates skills, requirements, and responsibilities
 * 2. Optimizes keywords for SEO and ATS systems
 * 3. Ensures consistency across all fields
 * 4. Fills gaps intelligently from accumulated context
 * 5. Normalizes terminology and formatting
 * 6. Enhances descriptions for clarity and impact
 */

const OPTIMIZATION_PROMPT = `You are an expert HR content strategist and job description optimizer. Your task is to continuously refine and optimize a job posting as new context is added.

## YOUR ROLE
You receive:
1. The CURRENT state of a job template (partially filled)
2. NEW context that was just added (could be from a document, URL, search, etc.)
3. The SOURCE TYPE of the new context

## YOUR TASKS

### 1. INTELLIGENT MERGING
- Merge new information with existing fields WITHOUT losing any valuable existing content
- If new info contradicts existing info, prefer the more specific/detailed version
- Combine similar items (e.g., merge overlapping responsibilities)

### 2. DEDUPLICATION
- Remove duplicate skills, requirements, and responsibilities
- Consolidate similar items into single, comprehensive entries
- Keep the most descriptive version when merging duplicates

### 3. SEO & ATS OPTIMIZATION
- Optimize job_title for searchability (include common variations)
- Enhance seo_keywords with industry-standard terms
- Use action verbs in responsibilities
- Include relevant certifications and credentials in requirements

### 4. FIELD ENHANCEMENT
- Expand terse entries into professional descriptions
- Ensure about_role.summary is compelling and complete
- Make responsibilities specific and measurable where possible
- Standardize formatting (e.g., years of experience as numbers)

### 5. CONSISTENCY
- Ensure tone is professional and consistent throughout
- Standardize terminology (e.g., always use "Bachelor's degree" not "BA/BS/Bachelors")
- Align requirements with responsibilities logically

### 6. GAP FILLING
- If new context reveals information for empty fields, fill them
- Infer reasonable values when strongly implied (mark confidence lower)
- Never fabricate information not supported by context

## OUTPUT FORMAT
Return a JSON object with this structure:
{
  "optimized_template": {
    // The full ClarvidaJobTemplate with all optimizations applied
    // Include ALL fields, even unchanged ones
  },
  "optimization_summary": {
    "fields_updated": ["array of field paths that were modified"],
    "fields_added": ["array of field paths that were newly populated"],
    "duplicates_removed": number,
    "enhancements_made": ["brief description of key enhancements"],
    "confidence": number 0-1
  }
}

## CLARVIDA JOB TEMPLATE STRUCTURE
{
  "job_title": "string",
  "specialty_credential": "string or null",
  "location": {
    "city": "string or null",
    "state": "string or null (2-letter code)",
    "work_arrangement": "On-site | Hybrid | Remote | Community-Based | null"
  },
  "employment_type": "Full-time | Part-time | Contract | null",
  "salary": {
    "type": "hourly | annual | null",
    "min": number or null,
    "max": number or null
  },
  "about_role": {
    "team_name": "string or null",
    "summary": "string - compelling 2-3 sentence summary",
    "primary_function": "string - main purpose",
    "population_served": "string or null"
  },
  "responsibilities": ["array of 5-10 key responsibilities with action verbs"],
  "required_qualifications": {
    "education": "string or null",
    "licensure": ["array of required licenses"],
    "experience_years": number or null,
    "technical_skills": ["array of required skills"],
    "other_requirements": ["array of other must-haves"]
  },
  "preferred_qualifications": {
    "skills": ["array of nice-to-have skills"],
    "experience": ["array of preferred experience"],
    "certifications": ["array of preferred certs"]
  },
  "benefits": {
    "daily_pay": boolean or null,
    "paid_vacation": boolean or null,
    "sick_leave": boolean or null,
    "paid_holidays": boolean or null,
    "medical_dental_vision": boolean or null,
    "hsa_fsa": boolean or null,
    "retirement_401k": boolean or null,
    "licensure_supervision": boolean or null,
    "ceu_opportunities": boolean or null,
    "mileage_reimbursement": boolean or null,
    "cellphone_stipend": boolean or null,
    "eap": boolean or null,
    "pet_insurance": boolean or null,
    "perks_program": boolean or null,
    "other_benefits": ["array"]
  },
  "company_info": {
    "name": "string or null",
    "description": "string or null",
    "culture": "string or null",
    "mission": "string or null"
  },
  "seo_keywords": ["array of 8-12 optimized keywords"]
}

IMPORTANT:
- Return ONLY valid JSON, no markdown formatting
- Preserve user-edited fields (marked in metadata) unless new info is clearly better
- Always return the complete template structure
- Be conservative - don't over-optimize or change meaning`;

const extractJson = (text) => {
  if (!text) return null;

  let jsonStr = text;
  jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    logger.warn('No JSON object found in optimization response');
    return null;
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.warn('Failed to parse optimization JSON', { error: error.message });
    return null;
  }
};

exports.optimizeJobTemplate = onRequest(
  {
    cors: true,
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed' });
      return;
    }

    try {
      const {
        currentTemplate,
        newContext,
        contextType,
        userEditedFields = []
      } = req.body || {};

      if (!currentTemplate) {
        res.status(400).json({
          success: false,
          error: 'currentTemplate is required'
        });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(503).json({
          success: false,
          error: 'GEMINI_API_KEY is not configured'
        });
        return;
      }

      logger.info('Starting job template optimization', {
        hasNewContext: !!newContext,
        contextType,
        userEditedFieldsCount: userEditedFields.length
      });

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3-pro-preview',
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json'
        }
      });

      // Build the optimization request
      let contextSection = '';
      if (newContext) {
        contextSection = `
## NEW CONTEXT JUST ADDED
Source Type: ${contextType || 'unknown'}
Content:
${typeof newContext === 'string' ? newContext : JSON.stringify(newContext, null, 2)}
`;
      }

      const userEditedSection = userEditedFields.length > 0
        ? `\n## USER-EDITED FIELDS (preserve unless clearly better info)\n${userEditedFields.join(', ')}`
        : '';

      const fullPrompt = `${OPTIMIZATION_PROMPT}

## CURRENT TEMPLATE STATE
${JSON.stringify(currentTemplate, null, 2)}
${contextSection}
${userEditedSection}

Now optimize the template by merging new context, deduplicating, and enhancing all fields. Return the complete optimized template as JSON.`;

      const result = await model.generateContent(fullPrompt);
      const rawText = result?.response?.text?.() || '';

      const parsed = extractJson(rawText);

      if (!parsed || !parsed.optimized_template) {
        logger.warn('Optimization failed to produce valid output');
        res.status(200).json({
          success: false,
          error: 'Optimization produced invalid output',
          raw: rawText.substring(0, 1000)
        });
        return;
      }

      logger.info('Optimization complete', {
        fieldsUpdated: parsed.optimization_summary?.fields_updated?.length || 0,
        fieldsAdded: parsed.optimization_summary?.fields_added?.length || 0,
        confidence: parsed.optimization_summary?.confidence
      });

      res.status(200).json({
        success: true,
        data: parsed.optimized_template,
        summary: parsed.optimization_summary || {
          fields_updated: [],
          fields_added: [],
          duplicates_removed: 0,
          enhancements_made: [],
          confidence: 0.7
        }
      });

    } catch (error) {
      logger.error('Job template optimization failed', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Optimization failed'
      });
    }
  }
);
