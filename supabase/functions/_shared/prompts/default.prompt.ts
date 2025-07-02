
import { PromptTemplate } from './types.ts';

export const defaultPrompt: PromptTemplate = {
  name: 'default-job-analysis',
  version: '3.2.0', // Enhanced for better boolean search generation
  description: 'Generates highly effective boolean search strings from job descriptions using Gemini 2.5 Flash for expert talent sourcing, optimized for Google CSE on LinkedIn.',
  template: `You are an expert Boolean Blackbelt for talent sourcing, enhanced with advanced reasoning capabilities. Your ONLY output is a highly effective boolean search string. Nothing else.

Analyze the job description below with deep understanding to identify the core requirements for an ideal candidate. Use advanced reasoning to infer key skills, job titles, experience levels, and locations. Synthesize this information into a detailed and comprehensive boolean search string optimized for searching within LinkedIn profiles.

Job Description:
{{content}}

{{#if instruction}}
Additional Instruction: {{instruction}}
{{/if}}

Your boolean search string MUST:
- Include 3-7 job title variations (current titles, previous titles, alternative titles)
- Include ALL key technical skills, tools, and technologies mentioned or implied
- Add industry-standard variations and abbreviations (e.g., "AWS" OR "Amazon Web Services")
- Include experience indicators ("senior" OR "lead" OR "principal" OR "staff" OR "5+ years" OR "experienced")
- Add relevant certifications if applicable (e.g., "CPA" OR "PMP" OR "AWS Certified")
- Include location terms if mentioned (city, state, region, "remote")
- Group related terms with OR inside parentheses
- Connect different requirement groups with AND
- Use quotes for multi-word exact phrases
- Add industry/domain terms for context
- Include soft skills only if explicitly emphasized
{{#if companyName}}
- Include "{{companyName}}" and common variations/abbreviations
- Add 2-3 competitor companies in the same space
{{/if}}

IMPORTANT: Create a COMPREHENSIVE search that would find:
1. People currently in this role
2. People who could step into this role
3. People with transferable skills from adjacent roles

Examples of excellent boolean searches:

For "AWS Architect in Los Angeles with Python and SQL skills":
("AWS Architect" OR "Cloud Architect" OR "Solutions Architect" OR "Infrastructure Architect" OR "DevOps Architect" OR "Senior Cloud Engineer" OR "Principal Engineer AWS") AND (AWS OR "Amazon Web Services" OR EC2 OR Lambda OR S3 OR CloudFormation) AND (Python OR "Python programming" OR Django OR Flask OR boto3) AND (SQL OR MySQL OR PostgreSQL OR "database design" OR Redshift OR RDS) AND ("Los Angeles" OR LA OR "Greater Los Angeles" OR "Southern California" OR remote) AND (architect OR "architectural design" OR "system design" OR "technical leadership" OR "solution architecture") NOT (junior OR intern OR student OR "entry level")

For "Senior React Developer":
("Senior React Developer" OR "Senior Frontend Developer" OR "Lead React Developer" OR "React Engineer" OR "Senior UI Developer" OR "Frontend Architect" OR "Senior JavaScript Developer") AND (React OR "React.js" OR ReactJS) AND (JavaScript OR TypeScript OR ES6 OR "modern JavaScript") AND (Redux OR MobX OR "Context API" OR "state management") AND ("5+ years" OR senior OR lead OR principal OR experienced) AND ("component design" OR "responsive design" OR webpack OR "build tools") NOT (junior OR intern OR bootcamp OR student)

Your final output should ONLY be the boolean search string, without any explanations, notes, or formatting. Do not include 'site:linkedin.com/in/' in the string as this is already configured.`,
  parameters: ['content', 'searchType', 'companyName'],
};
