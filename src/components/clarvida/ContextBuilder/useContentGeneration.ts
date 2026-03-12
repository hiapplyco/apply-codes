import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { functionBridge } from '@/lib/function-bridge';
import { generateLinkedInImage, saveImageToStorage } from '@/lib/gemini-image';
import { auth } from '@/lib/firebase';
import { ClarvidaJobTemplate } from '@/types/organization';
import { ContentType, GeneratedContent } from './types';
import { BENEFIT_LABELS } from './constants';

interface UseContentGenerationParams {
  template: Partial<ClarvidaJobTemplate>;
  contextItems: unknown[];
  contentTypes: ContentType[];
  selectedContentType: string;
  onJobDescriptionGenerated: (description: string, template: ClarvidaJobTemplate) => void;
  onContentGenerated?: (content: GeneratedContent, contentType: string) => void;
}

export function useContentGeneration({
  template,
  contextItems,
  contentTypes,
  selectedContentType,
  onJobDescriptionGenerated,
  onContentGenerated,
}: UseContentGenerationParams) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);

  const generateJobDescription = useCallback((): string => {
    const t = template;

    const salaryText = t.salary?.type === 'hourly'
      ? `$${t.salary.min?.toFixed(2) || '0.00'}/hour${t.salary.max ? ` - $${t.salary.max.toFixed(2)}/hour` : ''}`
      : `$${(t.salary?.min || 0).toLocaleString()}/year${t.salary?.max ? ` - $${t.salary.max.toLocaleString()}/year` : ''}`;

    const benefitsList = Object.entries(t.benefits || {})
      .filter(([_, enabled]) => enabled)
      .map(([key]) => BENEFIT_LABELS[key as keyof typeof BENEFIT_LABELS])
      .filter(Boolean);

    const responsibilities = (t.responsibilities || []).filter((r: string) => r.trim()).map((r: string) => `- ${r}`).join('\n');
    const licensureList = (t.required_qualifications?.licensure || []).filter((l: string) => l.trim()).join(', ');
    const technicalSkills = (t.required_qualifications?.technical_skills || []).filter((s: string) => s.trim()).join(', ');
    const otherReqs = (t.required_qualifications?.other_requirements || []).filter((r: string) => r.trim()).map((r: string) => `- ${r}`).join('\n');

    return `# Job Title: ${t.job_title || '[Position Title]'}${t.specialty_credential ? ` – ${t.specialty_credential}` : ''}

**Location:** ${t.location?.city || '[City]'}, ${t.location?.state || '[State]'} (${t.location?.work_arrangement || 'On-site'})
**Employment Type:** ${t.employment_type || 'Full-time'}
**Salary:** ${salaryText}
**Date Posted:** ${new Date().toLocaleDateString()}

---

## About the Role

Clarvida is hiring a ${t.job_title || '[Job Title]'} to join our ${t.about_role?.team_name || '[Team or Program Name]'} in ${t.location?.city || '[Location]'}, ${t.location?.state || ''}. This ${t.employment_type?.toLowerCase() || 'full-time'} role offers competitive pay, growth opportunities, and comprehensive benefits.

${t.about_role?.summary || '[Brief summary of the role]'}

As a ${t.job_title || '[Job Title]'}, you will ${t.about_role?.primary_function || '[1-2 sentence summary of the primary function]'}. ${t.about_role?.population_served ? `You'll work with ${t.about_role.population_served}.` : ''} You'll collaborate with clients, families, and care teams to deliver services that align with Clarvida's person-centered and trauma-informed care model.

---

## Responsibilities

${responsibilities || '- [Responsibility #1]\n- [Responsibility #2]\n- [Responsibility #3]'}

---

## Required Qualifications

${t.required_qualifications?.education ? `- **Education:** ${t.required_qualifications.education}` : '- **Education:** [Education level]'}
${licensureList ? `- **Licensure/Certification:** ${licensureList}` : '- **Licensure/Certification:** [Required licenses]'}
${t.required_qualifications?.experience_years ? `- **Experience:** ${t.required_qualifications.experience_years}+ years` : ''}
${technicalSkills ? `- **Technical Skills:** ${technicalSkills}` : ''}
${otherReqs ? `\n${otherReqs}` : ''}

---

## Compensation & Benefits

- **Salary:** ${salaryText}
${benefitsList.map(b => `- ${b}`).join('\n')}

---

## Work Location

${t.location?.city || '[City]'}, ${t.location?.state || '[State]'} – ${t.location?.work_arrangement || 'On-site'}

---

## Employment Type

${t.employment_type || 'Full-time'}

---

## How to Apply

If you're passionate about behavioral health and making a difference in people's lives, we encourage you to apply. Click "Apply Now" to join a dedicated team that values growth, compassion, and community impact.

---

## About Clarvida

Clarvida is a trusted provider of behavioral health and human services. With programs across multiple states, we deliver trauma-informed, recovery-focused support to individuals and families in need. We are committed to cultural responsiveness, equity, and evidence-based care that improves lives and strengthens communities.

Learn more: www.clarvida.com/mission-vision-and-values
Explore other opportunities: www.clarvida.com/working-at-clarvida

---

## Equal Opportunity Employer

Clarvida is an equal opportunity employer. All qualified applicants will receive consideration without regard to race, color, religion, gender, sexual orientation, gender identity, national origin, age, disability, or veteran status.

---

## Fraud Alert

Clarvida does not charge application fees or conduct interviews via messaging apps. Communication about legitimate job offers will only come from a Clarvida.com email or verified LinkedIn account.

${t.seo_keywords?.length ? `\n---\n\n**Keywords:** ${t.seo_keywords.join(', ')}` : ''}`;
  }, [template]);

  const buildContextFromTemplate = useCallback((): string => {
    const t = template;
    const responsibilities = (t.responsibilities || []).filter((r: string) => r.trim()).join(', ');
    const licensure = (t.required_qualifications?.licensure || []).filter((l: string) => l.trim()).join(', ');
    const skills = (t.required_qualifications?.technical_skills || []).filter((s: string) => s.trim()).join(', ');

    return `
Job Title: ${t.job_title || '[Not specified]'}
Specialty: ${t.specialty_credential || '[Not specified]'}
Location: ${t.location?.city || '[City]'}, ${t.location?.state || '[State]'} (${t.location?.work_arrangement || 'On-site'})
Employment Type: ${t.employment_type || 'Full-time'}
Salary Range: ${t.salary?.min || 0} - ${t.salary?.max || 0} (${t.salary?.type || 'hourly'})
Team/Program: ${t.about_role?.team_name || '[Not specified]'}
Role Summary: ${t.about_role?.summary || '[Not specified]'}
Primary Function: ${t.about_role?.primary_function || '[Not specified]'}
Population Served: ${t.about_role?.population_served || '[Not specified]'}
Responsibilities: ${responsibilities || '[Not specified]'}
Education: ${t.required_qualifications?.education || '[Not specified]'}
Licensure: ${licensure || '[Not specified]'}
Experience: ${t.required_qualifications?.experience_years || 0}+ years
Technical Skills: ${skills || '[Not specified]'}
Company: Clarvida - Behavioral health and human services provider
    `.trim();
  }, [template]);

  const extractMetadata = (content: string, contentType: string): GeneratedContent['metadata'] => {
    const metadata: GeneratedContent['metadata'] = {
      jobTitle: template.job_title || undefined,
      companyName: 'Clarvida',
    };

    if (contentType === 'LinkedIn Job Post') {
      const hashtags = content.match(/#\w+/g)?.map(h => h.slice(1)) || [];
      metadata.hashtags = hashtags;
    }

    if (contentType.includes('Email') || contentType.includes('Letter')) {
      const subjectMatch = content.match(/Subject:\s*(.+?)(?:\n|$)/i);
      if (subjectMatch) metadata.subject = subjectMatch[1].trim();
    }

    return metadata;
  };

  const handleGenerate = async (formValidation: { hasMinimumData: boolean; isValid: boolean; missingFields: string[] }) => {
    if (!formValidation.hasMinimumData) {
      toast.error('Please fill out at least one field or add context before generating');
      return;
    }

    if (!formValidation.isValid) {
      toast.warning(`Missing required fields: ${formValidation.missingFields.join(', ')}`);
    }

    setIsGenerating(true);
    setShowGenerationDialog(true);

    try {
      if (selectedContentType === 'Job Description') {
        const response = await functionBridge.generateJobDescription({
          template: template,
          contextItems: contextItems,
          config: { tone: 'professional', format: 'markdown' },
        });

        if (response?.success && response.description) {
          onJobDescriptionGenerated(response.description, template as ClarvidaJobTemplate);
          toast.success('Job description generated with AI!');
        } else {
          throw new Error(response?.error || 'Failed to generate job description');
        }
        return;
      }

      const selectedType = contentTypes.find(t => t.content_type === selectedContentType);
      if (!selectedType) {
        toast.error('Please select a content type');
        return;
      }

      const contextString = buildContextFromTemplate();

      const response = await functionBridge.generateContent({
        contentType: selectedContentType,
        userInput: contextString,
        prompt: contextString,
        systemPrompt: selectedType.system_prompt,
        contextContent: '',
        projectContext: '',
      });

      if (response?.content) {
        const metadata = extractMetadata(response.content, selectedContentType);

        if (selectedContentType === 'LinkedIn Job Post') {
          try {
            toast.info('Generating LinkedIn image...', { duration: 3000 });
            const imageResult = await generateLinkedInImage({
              jobTitle: template.job_title || 'Professional Role',
              location: template.location?.city
                ? `${template.location.city}, ${template.location.state}`
                : undefined,
              companyName: 'Clarvida',
            });

            metadata!.imageUrl = imageResult.dataUrl;
            metadata!.imageData = imageResult;

            const currentUser = auth?.currentUser;
            if (currentUser) {
              try {
                const { storageUrl, storagePath } = await saveImageToStorage(imageResult, currentUser.uid, 'linkedin-post');
                metadata!.imageStorageUrl = storageUrl;
                metadata!.imageStoragePath = storagePath;
              } catch (storageError) {
                console.warn('[ContextBuilder] Failed to save image to storage:', storageError);
              }
            }
          } catch (imageError) {
            console.warn('[ContextBuilder] LinkedIn image generation failed:', imageError);
          }
        }

        const generatedContent: GeneratedContent = {
          type: selectedContentType,
          content: response.content,
          metadata,
        };

        if (onContentGenerated) {
          onContentGenerated(generatedContent, selectedContentType);
        }

        toast.success(`${selectedContentType} generated!`);
      } else {
        throw new Error('No content received from AI');
      }
    } catch (error) {
      console.error('[ContextBuilder] Generation failed:', error);
      toast.error(`Failed to generate ${selectedContentType}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setShowGenerationDialog(false), 1000);
    }
  };

  const copyToClipboard = () => {
    const description = generateJobDescription();
    navigator.clipboard.writeText(description);
    toast.success('Copied to clipboard!');
  };

  return {
    isGenerating,
    showGenerationDialog,
    setShowGenerationDialog,
    handleGenerate,
    copyToClipboard,
    generateJobDescription,
  };
}
