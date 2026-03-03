const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getModel } = require('./utils/gemini');

/**
 * Clarvida Brand Guidelines for Image Generation
 */
const CLARVIDA_BRAND_CONTEXT = `
## CLARVIDA BRAND GUIDELINES

### About Clarvida
Clarvida (formally known as Pathways) provides essential community-based services including:
- Mental health care and counseling
- Substance abuse treatment
- Support for individuals with autism and disabilities
- Child and family services
- Foster care and residential services

They serve 60,000 clients annually across 17 states and Washington D.C.

### Core Values
- **Resilience**: Our struggles develop our strengths
- **Inclusion**: Every voice has a value
- **Advocacy**: Be the voice of those who need one
- **Compassion**: Caring can change the world
- **Accountability**: Our choices are sources of power and pride

### Brand Colors
- Primary Teal: #0B5B5E (dark teal, professional, trustworthy)
- Accent Gold: #D4A03C (warm, hopeful, aspirational)
- Supporting colors: soft teals, warm whites, calming blues

### Visual Style Guidelines
- Warm, compassionate, and professional imagery
- Focus on human connection and care
- Diverse representation of people and communities
- Natural lighting, welcoming environments
- Avoid clinical or institutional settings when possible
- Show genuine moments of support, growth, and connection
- Healthcare professionals in approachable settings
- Community-focused, not corporate

### Target Audience for Recruitment
- Mental health professionals (LCSW, LPC, LMFT, psychologists)
- Behavioral health technicians
- Nurses and healthcare providers
- Social workers and case managers
- Support specialists and caregivers
`;

/**
 * Build the image generation prompt based on context and options
 */
function buildImagePrompt(context, options = {}) {
  const {
    style = 'photorealistic',
    textOverlay = null,
    aspectRatio = '1:1',
    purpose = 'linkedin'
  } = options;

  // Style presets
  const styleGuides = {
    photorealistic: `
      Create a photorealistic image that looks like it was taken from a real-life scenario.
      The image should feel authentic, warm, and professionally captured.
      Use natural lighting and genuine human expressions.
      The scene should look candid, not staged or stock-photo-like.
    `,
    professional: `
      Create a clean, professional image suitable for corporate communications.
      Polished but approachable aesthetic.
      Modern, minimalist design sensibility with professional lighting.
    `,
    warm_community: `
      Create an image emphasizing warmth, community, and human connection.
      Soft, inviting colors and lighting.
      Focus on diverse people engaging positively with each other.
    `,
    inspirational: `
      Create an uplifting, inspirational image that evokes hope and positive change.
      Dramatic but warm lighting, aspirational mood.
      Emphasize growth, achievement, and possibility.
    `,
    healthcare_compassion: `
      Create an image showing compassionate healthcare in action.
      Warm interactions between care providers and those they serve.
      Professional but human-centered, avoiding clinical coldness.
    `,
    recruitment: `
      Create an engaging recruitment-focused image.
      Show fulfilling work environments and meaningful professional interactions.
      Emphasize career growth, teamwork, and making a difference.
    `
  };

  // Platform-specific guidance
  const platformGuides = {
    linkedin: `
      Optimized for LinkedIn feed posts.
      Professional appearance while remaining warm and approachable.
      Clear focal point that works at various sizes.
      Suitable for business/recruitment context.
    `,
    instagram: `
      Visually striking and engaging for Instagram.
      Bold colors and clear composition.
      Eye-catching even at thumbnail size.
    `,
    facebook: `
      Versatile image suitable for Facebook engagement.
      Works well with accompanying text posts.
      Shareable and relatable visual style.
    `,
    general: `
      Versatile image suitable for multiple social media platforms.
      Clear composition that works at various aspect ratios.
    `
  };

  const selectedStyle = styleGuides[style] || styleGuides.photorealistic;
  const platformGuide = platformGuides[purpose] || platformGuides.linkedin;

  let prompt = `
${CLARVIDA_BRAND_CONTEXT}

## IMAGE GENERATION TASK

Create a marketing image for Clarvida's social media presence.

### Context/Topic
${context}

### Visual Style
${selectedStyle}

### Platform Optimization
${platformGuide}

### Technical Requirements
- Aspect ratio: ${aspectRatio}
- High resolution, crisp and clear
- Appropriate for professional social media
- Include diverse representation when showing people
- Align with Clarvida's warm, compassionate brand identity
`;

  // Add text overlay instructions if provided
  if (textOverlay && textOverlay.trim()) {
    prompt += `

### Text Overlay Requirements
Include the following text rendered clearly and legibly within the image:
"${textOverlay}"

Text styling guidance:
- Use clean, readable fonts
- Ensure strong contrast between text and background
- Position text where it doesn't obscure key visual elements
- Text should feel integrated with the overall design
- Consider using Clarvida's brand colors (#0B5B5E teal or #D4A03C gold) for text or text backgrounds
`;
  } else {
    prompt += `

### No Text Overlay
Do not include any text, words, or typography in the image.
The image should be purely visual, suitable for adding text overlays later if needed.
`;
  }

  prompt += `

### Final Output
Generate a single, high-quality image that embodies Clarvida's mission of providing compassionate community-based services while appealing to potential employees and partners.
`;

  return prompt;
}

/**
 * Firebase Cloud Function: generateClarvidaMarketingImage
 *
 * Generates marketing images for Clarvida using Gemini's image generation (Nano Banana Pro)
 *
 * Request body:
 * - context (required): Description of what the image should convey
 * - style (optional): 'photorealistic' | 'professional' | 'warm_community' | 'inspirational' | 'healthcare_compassion' | 'recruitment'
 * - textOverlay (optional): Text to render on the image
 * - aspectRatio (optional): '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
 * - purpose (optional): 'linkedin' | 'instagram' | 'facebook' | 'general'
 */
exports.generateClarvidaMarketingImage = onCall(
  {
    timeoutSeconds: 120,
    memory: '1GiB',
  },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const {
        context,
        style,
        textOverlay,
        aspectRatio = '1:1',
        purpose = 'linkedin'
      } = data || {};

      // Validate required fields
      if (!context || typeof context !== 'string' || context.trim().length === 0) {
        throw new HttpsError('invalid-argument', 'Context is required and must be a non-empty string describing the desired image');
      }

      // Validate style if provided
      const validStyles = ['photorealistic', 'professional', 'warm_community', 'inspirational', 'healthcare_compassion', 'recruitment'];
      if (style && !validStyles.includes(style)) {
        throw new HttpsError('invalid-argument', `Invalid style. Must be one of: ${validStyles.join(', ')}`);
      }

      // Validate aspect ratio if provided
      const validAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'];
      if (aspectRatio && !validAspectRatios.includes(aspectRatio)) {
        throw new HttpsError('invalid-argument', `Invalid aspectRatio. Must be one of: ${validAspectRatios.join(', ')}`);
      }

      logger.info('Generating Clarvida marketing image', {
        contextLength: context.length,
        style: style || 'photorealistic',
        hasTextOverlay: !!textOverlay,
        aspectRatio,
        purpose
      });

      // Use Gemini 3 Pro Image Preview for image generation
      // getModel allows specifying custom model + config
      const model = getModel('gemini-3-pro-image-preview', {
        temperature: 0.8,
        maxOutputTokens: 8192,
        responseModalities: ['TEXT', 'IMAGE'],
      });

      if (!model) {
        throw new HttpsError('unavailable', 'GEMINI_API_KEY is not configured');
      }

      const prompt = buildImagePrompt(context, {
        style: style || 'photorealistic',
        textOverlay,
        aspectRatio,
        purpose
      });

      const result = await model.generateContent([{ text: prompt }]);

      const response = result.response;
      const parts = response.candidates?.[0]?.content?.parts || [];

      let imageData = null;
      let textResponse = null;

      for (const part of parts) {
        if (part.text) {
          textResponse = part.text;
        } else if (part.inlineData) {
          imageData = {
            mimeType: part.inlineData.mimeType || 'image/png',
            data: part.inlineData.data // Base64 encoded image
          };
        }
      }

      if (!imageData) {
        logger.warn('No image generated in response', { textResponse });
        throw new HttpsError('internal', 'Image generation failed - no image in response');
      }

      logger.info('Successfully generated Clarvida marketing image', {
        mimeType: imageData.mimeType,
        hasTextResponse: !!textResponse
      });

      return {
        success: true,
        data: {
          image: imageData,
          description: textResponse,
          metadata: {
            style: style || 'photorealistic',
            aspectRatio,
            purpose,
            hasTextOverlay: !!textOverlay,
            generatedAt: new Date().toISOString()
          }
        }
      };

    } catch (error) {
      logger.error('Clarvida marketing image generation failed', {
        error: error.message,
        stack: error.stack
      });

      if (error instanceof HttpsError) throw error;

      // Check for specific error types
      if (error.message?.includes('not found') || error.message?.includes('model')) {
        throw new HttpsError('unavailable', 'Image generation model not available. The model may require additional permissions or may not be available in your region.');
      }

      throw new HttpsError('internal', error.message || 'Failed to generate marketing image');
    }
  }
);
