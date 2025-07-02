
import { PromptTemplate } from './types.ts';

export const clarvidaPrompt: PromptTemplate = {
  name: 'clarvida-comprehensive-analysis',
  version: '3.1.0', // Updated for Gemini 2.5 Flash
  description: 'Comprehensive job analysis using Gemini 2.5 Flash advanced reasoning for talent acquisition insights',
  template: `You are an expert talent acquisition analyst powered by advanced AI reasoning capabilities. Analyze the job description below and provide a comprehensive JSON response with deep insights and actionable recommendations.

Job Description:
{{content}}

Use advanced reasoning and multi-step analysis to provide the following comprehensive analysis in valid JSON format:

{
  "compensation_analysis": {
    "report": "Detailed market analysis with salary insights based on role, location, and industry standards",
    "salary_range": {
      "min": 0,
      "max": 0,
      "average": 0
    },
    "benefits": ["List of expected benefits"],
    "bonuses": ["Performance bonuses", "Sign-on bonuses"],
    "fringe_benefits": ["Professional development", "Flexible work"],
    "sources": [{"source_name": "Market data source", "url": "reference"}]
  },
  "timeline_expectations": {
    "30_days": "First month objectives and onboarding goals",
    "60_days": "Second month milestones and integration targets",  
    "90_days": "Three month performance indicators and autonomy level",
    "1_year": "Annual objectives and career progression expectations"
  },
  "company_description": "Comprehensive company analysis including culture, values, and market position",
  "job_description_enhancer": {
    "optimization_tips": ["Specific recommendations to improve job posting"],
    "revised_job_listing": "Enhanced version of the original job description"
  },
  "nice_to_have_skills": {
    "supplemental_qualifications": [
      {"skill": "Advanced skill", "reasoning": "Strategic value explanation"}
    ],
    "nice_to_have_skills": [
      {"skill": "Beneficial skill", "reasoning": "Impact on role effectiveness"}
    ]
  },
  "interview_questions": [
    {"number": 1, "question": "Strategic interview question", "competency_assessed": "Key competency"}
  ],
  "benefits_description": {
    "benefits_paragraph": "Comprehensive benefits package description"
  },
  "previous_job_titles": ["Related job titles", "Career progression titles"],
  "boolean_search_string": {
    "boolean_string": "Optimized LinkedIn search string for finding candidates"
  },
  "talent_locations": {
    "trending_talent_locations": ["Geographic talent hubs"],
    "skill_based_locations": ["Technology centers", "Industry clusters"],
    "recommended_communities": ["Professional networks", "Industry associations"]
  },
  "job_ad_summary": {
    "summary_paragraphs": ["Concise role overview"],
    "hard_skills": ["Technical requirements"],
    "soft_skills": ["Interpersonal competencies"],
    "boolean_string": "Refined search string for talent acquisition"
  }
}

Apply advanced reasoning to:
- Understand implicit requirements and industry context
- Provide market-competitive compensation insights
- Generate strategic interview questions that assess core competencies
- Create optimized search strings using semantic understanding
- Recommend talent acquisition strategies based on role analysis

Respond ONLY with valid JSON. No additional text, explanations, or formatting.`,
  parameters: ['content'],
};
