const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getJsonModel } = require('./utils/gemini');

/**
 * Gemini-powered document extraction for job context building
 * Supports: PDF, DOCX, DOC, TXT, Images (JPG, PNG)
 *
 * Uses Gemini's native multimodal capabilities to extract and structure
 * document content directly into the ClarvidaJobTemplate format.
 */

const JOB_EXTRACTION_PROMPT = `You are an expert document analyst specializing in extracting job-related information from various document types including resumes, job descriptions, company profiles, and general business documents.

Analyze the provided document and extract all relevant information that could be used to create or enhance a job posting. The document may be:
- A job description/posting
- A resume/CV (extract skills, experience levels, job titles that could inform job requirements)
- Company information (extract culture, benefits, team info)
- Any other professional document

Extract and return a JSON object with as many of these fields as can be determined from the document:

{
  "job_title": "string - The job title if this is a job posting, or inferred title if resume",
  "specialty_credential": "string or null - Specific credentials mentioned (LCSW, LPC, RN, BCBA, PMP, etc.)",
  "location": {
    "city": "string or null",
    "state": "string or null (use 2-letter code for US states)",
    "work_arrangement": "On-site | Hybrid | Remote | Community-Based | null"
  },
  "employment_type": "Full-time | Part-time | Contract | null",
  "salary": {
    "type": "hourly | annual | null",
    "min": "number or null",
    "max": "number or null"
  },
  "about_role": {
    "team_name": "string or null - Name of team/department",
    "summary": "string - 1-2 sentence role summary based on document content",
    "primary_function": "string - Main purpose of the role",
    "population_served": "string or null - Who the role serves"
  },
  "responsibilities": ["array of responsibility strings - key duties and tasks"],
  "required_qualifications": {
    "education": "string or null - Required education level",
    "licensure": ["array of required licenses/certifications"],
    "experience_years": "number or null",
    "technical_skills": ["array of technical/clinical skills"],
    "other_requirements": ["array of other requirements"]
  },
  "preferred_qualifications": {
    "skills": ["array of preferred but not required skills"],
    "experience": ["array of preferred experience"],
    "certifications": ["array of preferred certifications"]
  },
  "benefits": {
    "daily_pay": "boolean or null",
    "paid_vacation": "boolean or null",
    "sick_leave": "boolean or null",
    "paid_holidays": "boolean or null",
    "medical_dental_vision": "boolean or null",
    "hsa_fsa": "boolean or null",
    "retirement_401k": "boolean or null",
    "licensure_supervision": "boolean or null",
    "ceu_opportunities": "boolean or null",
    "mileage_reimbursement": "boolean or null",
    "cellphone_stipend": "boolean or null",
    "eap": "boolean or null",
    "pet_insurance": "boolean or null",
    "perks_program": "boolean or null",
    "other_benefits": ["array of other benefits mentioned"]
  },
  "company_info": {
    "name": "string or null",
    "description": "string or null",
    "culture": "string or null",
    "mission": "string or null"
  },
  "seo_keywords": ["array of 5-10 relevant keywords for SEO"],
  "raw_text_summary": "string - A 2-3 paragraph summary of the document content for reference",
  "document_type": "job_description | resume | company_info | general - What type of document this appears to be",
  "extraction_confidence": "number 0-1 - How confident you are in the extraction"
}

IMPORTANT RULES:
1. Extract ONLY information explicitly stated or strongly implied in the document
2. Set fields to null if information is not present
3. For benefits, only set to true if explicitly mentioned
4. For salary, convert text to numbers (e.g., "$25/hour" becomes { type: "hourly", min: 25, max: null })
5. If this is a resume, extract skills/experience that would inform job requirements
6. Always provide a raw_text_summary for reference
7. Be conservative with confidence scores

Return ONLY the JSON object, no additional text or markdown formatting.`;

const extractJson = (text) => {
  if (!text) return null;

  // Try to find JSON in the response
  let jsonStr = text;

  // Remove markdown code blocks if present
  jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

  // Try to extract JSON object
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    logger.warn('No JSON object found in response');
    return null;
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.warn('Failed to parse extraction JSON response', { error: error.message });
    return null;
  }
};

/**
 * Get MIME type from file extension
 */
const getMimeType = (fileName) => {
  const ext = fileName?.toLowerCase()?.split('.')?.pop();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

exports.extractDocumentGemini = onCall(
  {
    timeoutSeconds: 300,
    memory: '1GiB',
  },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { fileData, mimeType, fileName, additionalContext } = data || {};

      // Validate input
      if (!fileData) {
        throw new HttpsError('invalid-argument', 'fileData (base64) is required');
      }

      // Determine MIME type
      const resolvedMimeType = mimeType || getMimeType(fileName) || 'application/pdf';

      logger.info('Starting Gemini document extraction', {
        fileName,
        mimeType: resolvedMimeType,
        dataLength: fileData.length,
        hasAdditionalContext: !!additionalContext
      });

      const model = getJsonModel('gemini-3.1-pro-preview', {
        temperature: 0.2,
        maxOutputTokens: 8192,
      });

      if (!model) {
        throw new HttpsError('unavailable', 'GEMINI_API_KEY is not configured');
      }

      // Build the prompt with optional additional context
      let fullPrompt = JOB_EXTRACTION_PROMPT;
      if (additionalContext) {
        fullPrompt += `\n\n## ADDITIONAL CONTEXT\n${additionalContext}`;
      }

      // Create content parts with file data
      const contentParts = [
        {
          inlineData: {
            mimeType: resolvedMimeType,
            data: fileData // Already base64 encoded
          }
        },
        {
          text: fullPrompt
        }
      ];

      logger.info('Sending to Gemini for extraction...');

      const result = await model.generateContent(contentParts);
      const rawText = result?.response?.text?.() || '';

      logger.info('Gemini response received', {
        responseLength: rawText.length
      });

      const extracted = extractJson(rawText);

      if (!extracted) {
        // If JSON parsing failed, return the raw text for debugging
        return {
          success: false,
          error: 'Failed to parse extraction results as JSON',
          raw: rawText.substring(0, 2000) // Truncate for response size
        };
      }

      // Separate metadata from job data
      const {
        extraction_confidence,
        document_type,
        raw_text_summary,
        ...jobData
      } = extracted;

      return {
        success: true,
        data: jobData,
        metadata: {
          confidence: extraction_confidence || 0.7,
          documentType: document_type || 'unknown',
          rawTextSummary: raw_text_summary || null,
          fileName,
          mimeType: resolvedMimeType,
          processedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Gemini document extraction failed', {
        error: error.message,
        stack: error.stack
      });

      if (error instanceof HttpsError) throw error;

      // Provide specific error messages
      let errorMessage = 'Document extraction failed';
      if (error.message?.includes('SAFETY')) {
        errorMessage = 'Document was blocked by content safety filters. Please try a different document.';
      } else if (error.message?.includes('quota') || error.message?.includes('rate')) {
        errorMessage = 'API rate limit reached. Please try again in a moment.';
      } else if (error.message?.includes('invalid') || error.message?.includes('format')) {
        errorMessage = 'Document format not supported or file is corrupted.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new HttpsError('internal', errorMessage);
    }
  }
);
