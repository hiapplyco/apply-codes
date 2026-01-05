const { onRequest } = require('firebase-functions/v2/https');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('firebase-functions/logger');

const EXTRACTION_PROMPT = `You are a job posting analyst specializing in healthcare and behavioral health positions. Extract structured job information from the provided content.

IMPORTANT: Only extract information that is explicitly stated or can be reasonably inferred from the content. Set fields to null if not present or unclear.

Extract and return a JSON object matching this ClarvidaJobTemplate structure:

{
  "job_title": "string - The job title (e.g., 'Licensed Clinical Social Worker', 'Behavioral Health Technician')",
  "specialty_credential": "string or null - Any specific credentials mentioned (LCSW, LPC, RN, BCBA, etc.)",
  "location": {
    "city": "string or null",
    "state": "string or null (use 2-letter code for US states)",
    "work_arrangement": "On-site" | "Hybrid" | "Remote" | "Community-Based" | null
  },
  "employment_type": "Full-time" | "Part-time" | "Contract" | null,
  "salary": {
    "type": "hourly" | "annual" | null,
    "min": number or null,
    "max": number or null
  },
  "about_role": {
    "team_name": "string or null - Name of team/department",
    "summary": "string - 1-2 sentence role summary",
    "primary_function": "string - Main purpose of the role",
    "population_served": "string or null - Who the role serves (e.g., 'children and adolescents', 'adults with substance use disorders')"
  },
  "responsibilities": ["array of responsibility strings - key duties and tasks"],
  "required_qualifications": {
    "education": "string or null - Required education level",
    "licensure": ["array of required licenses/certifications"],
    "experience_years": number or null,
    "technical_skills": ["array of technical/clinical skills"],
    "other_requirements": ["array of other requirements like background check, valid driver's license, etc."]
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
    "perks_program": boolean or null
  },
  "seo_keywords": ["array of relevant keywords for SEO"],
  "extraction_meta": {
    "confidence": number 0-1 (overall confidence in extraction),
    "fields_extracted": number (count of non-null fields),
    "fields_inferred": number (count of fields that were inferred rather than explicit),
    "source_type": "string - type of source content"
  }
}

Rules:
1. Only include fields you can extract or reasonably infer
2. Set fields to null if not present in the content
3. For benefits, only set to true if explicitly mentioned; leave null if uncertain
4. For salary, convert to numbers (e.g., "$25/hour" becomes { type: "hourly", min: 25, max: null })
5. Extract 5-10 relevant SEO keywords from the content
6. Be conservative with confidence scores

Return ONLY the JSON object, no additional text.`;

const extractJson = (text) => {
  if (!text) return null;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.warn('Failed to parse extraction JSON response', { error });
    return null;
  }
};

exports.extractJobContext = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: '1GiB',
  },
  async (req, res) => {
    // Handle CORS preflight
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
      const { content, contentType, metadata } = req.body || {};

      if (!content || typeof content !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Content is required and must be a string'
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

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-preview-05-20',
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent extraction
          maxOutputTokens: 4096,
          responseMimeType: 'application/json'
        }
      });

      // Build the prompt with content type context
      let contextualPrompt = EXTRACTION_PROMPT;

      if (contentType) {
        const typeDescriptions = {
          'text': 'This is raw text pasted by the user, likely a job description.',
          'file': 'This content was extracted from an uploaded document (PDF, DOC, etc.).',
          'url': 'This content was scraped from a job posting URL.',
          'search': 'This content is from a Perplexity AI search about the role or company.',
          'location': 'This is location information for the job position.'
        };
        contextualPrompt += `\n\n## SOURCE CONTEXT\n${typeDescriptions[contentType] || 'Unknown source type.'}`;
      }

      if (metadata) {
        contextualPrompt += `\n\n## METADATA\n${JSON.stringify(metadata, null, 2)}`;
      }

      contextualPrompt += `\n\n## CONTENT TO ANALYZE\n${content}`;

      logger.info('Extracting job context', {
        contentLength: content.length,
        contentType,
        hasMetadata: !!metadata
      });

      const result = await model.generateContent([
        { text: contextualPrompt }
      ]);

      const rawText = result?.response?.text?.() || '';
      const extracted = extractJson(rawText);

      if (!extracted) {
        res.status(200).json({
          success: false,
          error: 'Failed to parse extraction results',
          raw: rawText
        });
        return;
      }

      // Separate extraction_meta from the job data
      const { extraction_meta, ...jobData } = extracted;

      res.status(200).json({
        success: true,
        data: jobData,
        extractionMeta: extraction_meta || {
          confidence: 0.5,
          fields_extracted: Object.values(jobData).filter(v => v !== null).length,
          fields_inferred: 0,
          source_type: contentType || 'unknown'
        }
      });

    } catch (error) {
      logger.error('Job context extraction failed', { error });
      res.status(500).json({
        success: false,
        error: error.message || 'Job context extraction failed'
      });
    }
  }
);
