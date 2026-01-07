import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ContentGenerationDialog } from '@/components/ui/ContentGenerationDialog';
import { Plus, Minus, Sparkles, Copy, FileText, ChevronDown, ChevronUp, Brain, Trash2, Loader2, HelpCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ClarvidaJobTemplate } from '@/types/organization';
import { cn } from '@/lib/utils';
import { functionBridge } from '@/lib/function-bridge';
import { generateLinkedInImage, saveImageToStorage, GeneratedImage } from '@/lib/gemini-image';
import { auth } from '@/lib/firebase';

// Context Builder components
import { ContextInputSection } from './ContextBuilder/ContextInputSection';
import { ContextItemsDisplay } from './ContextBuilder/ContextItemsDisplay';
import { useContextBuilder } from './ContextBuilder/useContextBuilder';
import { ContextBuilderProps, ContentType, GeneratedContent } from './ContextBuilder/types';

const DEFAULT_BENEFITS = {
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

const BENEFIT_LABELS: Record<keyof typeof DEFAULT_BENEFITS, string> = {
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

export function ContextBuilder({ onJobDescriptionGenerated, onContentGenerated, initialTemplate }: ContextBuilderProps) {
  // Use the custom hook for context and template management
  const {
    contextItems,
    template,
    extractionState,
    optimizationState,
    addContextItem,
    removeContextItem,
    updateTemplate,
    isFieldExtracted,
    clearAllContext,
    getNestedValue,
  } = useContextBuilder(initialTemplate);

  const [keywordInput, setKeywordInput] = useState('');

  // Content type selection state
  const [selectedContentType, setSelectedContentType] = useState<string>('Job Description');
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load content types from public directory
  useEffect(() => {
    const loadContentTypes = async () => {
      try {
        const response = await fetch('/data/contentcreationbots.json');
        if (!response.ok) throw new Error('Failed to load content types');
        const data = await response.json();
        setContentTypes(data?.recruiter_hr_content || []);
      } catch (error) {
        console.error('[ContextBuilder] Error loading content types:', error);
        // Fallback to basic types
        setContentTypes([
          { content_type: 'Job Description', emoji: '📄', tooltip: 'Create job descriptions', system_prompt: '' }
        ]);
      }
    };
    loadContentTypes();
  }, []);
  const [expandedSections, setExpandedSections] = useState({
    context: true,
    basic: true,
    about: true,
    responsibilities: true,
    qualifications: true,
    benefits: false,
    keywords: false,
  });

  // Show generation dialog for AI content
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // Form validation - check if minimum required fields are filled
  const formValidation = useMemo(() => {
    const missingFields: string[] = [];

    if (!template.job_title?.trim()) missingFields.push('Job Title');
    if (!template.location?.city?.trim()) missingFields.push('City');
    if (!template.location?.state?.trim()) missingFields.push('State');

    // For AI content generation, require more context
    const needsMoreContext = selectedContentType !== 'Job Description' &&
      !template.about_role?.summary?.trim() &&
      !template.about_role?.primary_function?.trim();

    if (needsMoreContext) {
      missingFields.push('Role Summary or Primary Function');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      hasMinimumData: !!template.job_title?.trim() ||
                      !!template.location?.city?.trim() ||
                      !!template.about_role?.summary?.trim() ||
                      contextItems.length > 0,
    };
  }, [template, selectedContentType, contextItems.length]);

  // List management functions - memoized to prevent re-renders
  const addListItem = useCallback((path: string) => {
    const current = getNestedValue(template, path);
    if (Array.isArray(current)) {
      updateTemplate(path, [...current, '']);
    }
  }, [getNestedValue, template, updateTemplate]);

  const removeListItem = useCallback((path: string, index: number) => {
    const current = getNestedValue(template, path);
    if (Array.isArray(current) && current.length > 1) {
      updateTemplate(path, current.filter((_: any, i: number) => i !== index));
    }
  }, [getNestedValue, template, updateTemplate]);

  // CRITICAL: Memoized to prevent input focus loss on every keystroke
  const updateListItem = useCallback((path: string, index: number, value: string) => {
    const current = getNestedValue(template, path);
    if (Array.isArray(current)) {
      const newArray = [...current];
      newArray[index] = value;
      updateTemplate(path, newArray);
    }
  }, [getNestedValue, template, updateTemplate]);

  const addKeyword = () => {
    if (keywordInput.trim() && !template.seo_keywords?.includes(keywordInput.trim())) {
      updateTemplate('seo_keywords', [...(template.seo_keywords || []), keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    updateTemplate('seo_keywords', (template.seo_keywords || []).filter(k => k !== keyword));
  };

  const generateJobDescription = useCallback(() => {
    const t = template;

    const salaryText = t.salary?.type === 'hourly'
      ? `$${t.salary.min?.toFixed(2) || '0.00'}/hour${t.salary.max ? ` - $${t.salary.max.toFixed(2)}/hour` : ''}`
      : `$${(t.salary?.min || 0).toLocaleString()}/year${t.salary?.max ? ` - $${t.salary.max.toLocaleString()}/year` : ''}`;

    const benefitsList = Object.entries(t.benefits || {})
      .filter(([_, enabled]) => enabled)
      .map(([key]) => BENEFIT_LABELS[key as keyof typeof BENEFIT_LABELS])
      .filter(Boolean);

    const responsibilities = (t.responsibilities || []).filter(r => r.trim()).map(r => `- ${r}`).join('\n');
    const licensureList = (t.required_qualifications?.licensure || []).filter(l => l.trim()).join(', ');
    const technicalSkills = (t.required_qualifications?.technical_skills || []).filter(s => s.trim()).join(', ');
    const otherReqs = (t.required_qualifications?.other_requirements || []).filter(r => r.trim()).map(r => `- ${r}`).join('\n');

    const description = `# Job Title: ${t.job_title || '[Position Title]'}${t.specialty_credential ? ` – ${t.specialty_credential}` : ''}

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

    return description;
  }, [template]);

  // Build context string from template for AI content generation
  const buildContextFromTemplate = useCallback((): string => {
    const t = template;
    const responsibilities = (t.responsibilities || []).filter(r => r.trim()).join(', ');
    const licensure = (t.required_qualifications?.licensure || []).filter(l => l.trim()).join(', ');
    const skills = (t.required_qualifications?.technical_skills || []).filter(s => s.trim()).join(', ');

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

  // Extract metadata from generated content
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

  const handleGenerate = async () => {
    // Validate form before generation
    if (!formValidation.hasMinimumData) {
      toast.error('Please fill out at least one field or add context before generating');
      return;
    }

    if (!formValidation.isValid) {
      toast.warning(`Missing required fields: ${formValidation.missingFields.join(', ')}`);
      // Allow generation to proceed with warning, but show what's missing
    }

    // For Job Description, use the existing template-based generation (fast, no dialog needed)
    if (selectedContentType === 'Job Description') {
      const description = generateJobDescription();
      onJobDescriptionGenerated(description, template as ClarvidaJobTemplate);
      toast.success('Job description generated!');
      return;
    }

    // For other content types, use AI generation via function-bridge
    const selectedType = contentTypes.find(t => t.content_type === selectedContentType);
    if (!selectedType) {
      toast.error('Please select a content type');
      return;
    }

    // Show sophisticated loading dialog for AI content
    setIsGenerating(true);
    setShowGenerationDialog(true);
    try {
      const contextString = buildContextFromTemplate();

      console.log('[ContextBuilder] Generating content:', {
        contentType: selectedContentType,
        contextLength: contextString.length,
      });

      const response = await functionBridge.generateContent({
        contentType: selectedContentType,
        userInput: contextString,
        prompt: contextString, // Also send as 'prompt' for compatibility with cloud function
        systemPrompt: selectedType.system_prompt,
        contextContent: '',
        projectContext: '',
      });

      if (response?.content) {
        const metadata = extractMetadata(response.content, selectedContentType);

        // For LinkedIn posts, generate an AI image using Gemini nano-banana-pro
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

            // Use the data URL for immediate display
            metadata.imageUrl = imageResult.dataUrl;
            // Store the raw image data for download/copy functionality
            metadata.imageData = imageResult;

            // Save to Firebase Storage if user is authenticated
            const currentUser = auth?.currentUser;
            if (currentUser) {
              try {
                const { storageUrl, storagePath } = await saveImageToStorage(
                  imageResult,
                  currentUser.uid,
                  'linkedin-post'
                );
                metadata.imageStorageUrl = storageUrl;
                metadata.imageStoragePath = storagePath;
                console.log('[ContextBuilder] LinkedIn image saved to storage:', storagePath);
              } catch (storageError) {
                console.warn('[ContextBuilder] Failed to save image to storage:', storageError);
                // Continue with data URL - image still works for display
              }
            }

            console.log('[ContextBuilder] LinkedIn image generated successfully');
          } catch (imageError) {
            console.warn('[ContextBuilder] LinkedIn image generation failed, continuing without image:', imageError);
            // Continue without image - the mockup will handle missing images gracefully
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
      // Close dialog after a brief delay to show completion animation
      setTimeout(() => setShowGenerationDialog(false), 1000);
    }
  };

  const copyToClipboard = () => {
    const description = generateJobDescription();
    navigator.clipboard.writeText(description);
    toast.success('Copied to clipboard!');
  };

  // Field with AI indicator
  const AIField = ({
    path,
    label,
    placeholder,
    type = 'text',
    ...props
  }: {
    path: string;
    label: string;
    placeholder: string;
    type?: string;
    [key: string]: any;
  }) => {
    const extracted = isFieldExtracted(path);
    const value = getNestedValue(template, path);

    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          {label}
          {extracted && (
            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
              <Brain className="w-3 h-3 mr-1" />
              AI
            </Badge>
          )}
        </Label>
        <Input
          type={type}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => updateTemplate(path, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          className={cn(
            extracted && 'border-purple-300 bg-purple-50/50 focus:border-purple-500'
          )}
          {...props}
        />
      </div>
    );
  };

  const SectionHeader = ({
    title,
    section,
    icon: Icon,
    badge,
    instruction
  }: {
    title: string;
    section: keyof typeof expandedSections;
    icon: any;
    badge?: React.ReactNode;
    instruction?: string;
  }) => (
    <div
      className={cn(
        "flex items-center justify-between cursor-pointer p-3 rounded-lg transition-colors",
        section === 'context'
          ? "bg-gradient-to-r from-purple-100 to-purple-50 hover:from-purple-150 hover:to-purple-100"
          : "bg-gray-50 hover:bg-gray-100"
      )}
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("w-5 h-5", section === 'context' ? "text-purple-600" : "text-gray-600")} />
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {instruction && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-sm">{instruction}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {badge}
      </div>
      {expandedSections[section] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
    </div>
  );

  // Tooltip instructions for each section
  const sectionInstructions: Record<string, string> = {
    context: 'Step 1: Upload documents, paste URLs, or enter text to auto-fill the form with AI extraction.',
    basic: 'Step 2: Fill in the basic job information. Fields marked with * are recommended.',
    about: 'Step 2: Describe the role and team. This information appears in the job posting.',
    responsibilities: 'Step 3: List the key responsibilities. Add more items with the + button.',
    qualifications: 'Step 3: Specify required qualifications, skills, and experience.',
    benefits: 'Optional: Toggle the benefits offered with this position.',
    keywords: 'Optional: Add SEO keywords to improve job visibility in searches.',
  };

  return (
    <TooltipProvider>
      <Card className="border-2 border-purple-200 shadow-lg h-full flex flex-col overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Context Builder
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-5 h-5 text-purple-200 cursor-help ml-1" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-sm bg-white text-gray-900 border shadow-lg">
                <div className="space-y-2 p-1">
                  <p className="font-semibold">How to use Context Builder:</p>
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    <li><strong>Add Context</strong> - Upload docs, paste URLs, or enter text</li>
                    <li><strong>Review Fields</strong> - AI auto-fills, you can edit any field</li>
                    <li><strong>Add Details</strong> - Fill responsibilities & qualifications</li>
                    <li><strong>Generate</strong> - Create your content with one click</li>
                  </ol>
                </div>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <p className="text-purple-100 text-sm mt-1">
            Add context to auto-fill fields, or enter details manually
          </p>
        </CardHeader>

      <CardContent className="p-6 space-y-6 flex-1 min-h-0 overflow-y-auto">
        {/* Context Input Section */}
        <div className="space-y-4">
          <SectionHeader
            title="Context Input"
            section="context"
            icon={Brain}
            instruction={sectionInstructions.context}
            badge={
              contextItems.length > 0 ? (
                <Badge className="bg-purple-600 text-white text-xs">
                  {contextItems.length} items
                </Badge>
              ) : null
            }
          />
          {expandedSections.context && (
            <div className="pl-4 space-y-4">
              <ContextInputSection
                onContextAdded={addContextItem}
                isExtracting={extractionState.isExtracting}
              />

              <ContextItemsDisplay
                items={contextItems}
                onRemove={removeContextItem}
              />

              {/* Extraction Status */}
              {extractionState.fieldsExtracted > 0 && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 text-sm text-purple-700">
                    <Brain className="w-4 h-4" />
                    <span>
                      AI extracted <strong>{extractionState.fieldsExtracted}</strong> fields
                      {extractionState.confidence > 0 && (
                        <span className="text-purple-500 ml-1">
                          ({Math.round(extractionState.confidence * 100)}% confidence)
                        </span>
                      )}
                    </span>
                  </div>
                  {contextItems.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllContext}
                      className="text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <SectionHeader title="Basic Information" section="basic" icon={FileText} instruction={sectionInstructions.basic} />
          {expandedSections.basic && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
              <AIField path="job_title" label="Job Title *" placeholder="e.g., Licensed Clinical Social Worker" />
              <AIField path="specialty_credential" label="Specialty / Credential" placeholder="e.g., LCSW, LPC, RN" />
              <AIField path="location.city" label="City *" placeholder="e.g., Denver" />
              <AIField path="location.state" label="State *" placeholder="e.g., CO" />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Work Arrangement
                  {isFieldExtracted('location.work_arrangement') && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                      <Brain className="w-3 h-3 mr-1" />AI
                    </Badge>
                  )}
                </Label>
                <Select
                  value={template.location?.work_arrangement || 'On-site'}
                  onValueChange={(value) => updateTemplate('location.work_arrangement', value)}
                >
                  <SelectTrigger className={cn(isFieldExtracted('location.work_arrangement') && 'border-purple-300 bg-purple-50/50')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="On-site">On-site</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Community-Based">Community-Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Employment Type
                  {isFieldExtracted('employment_type') && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                      <Brain className="w-3 h-3 mr-1" />AI
                    </Badge>
                  )}
                </Label>
                <Select
                  value={template.employment_type || 'Full-time'}
                  onValueChange={(value) => updateTemplate('employment_type', value)}
                >
                  <SelectTrigger className={cn(isFieldExtracted('employment_type') && 'border-purple-300 bg-purple-50/50')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Salary Type</Label>
                <Select
                  value={template.salary?.type || 'hourly'}
                  onValueChange={(value) => updateTemplate('salary.type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <AIField
                  path="salary.min"
                  label={`Min ${template.salary?.type === 'hourly' ? '$/hr' : '$/yr'}`}
                  placeholder="0"
                  type="number"
                />
                <AIField
                  path="salary.max"
                  label={`Max ${template.salary?.type === 'hourly' ? '$/hr' : '$/yr'}`}
                  placeholder="0"
                  type="number"
                />
              </div>
            </div>
          )}
        </div>

        {/* About the Role */}
        <div className="space-y-4">
          <SectionHeader title="About the Role" section="about" icon={FileText} instruction={sectionInstructions.about} />
          {expandedSections.about && (
            <div className="space-y-4 pl-4">
              <AIField path="about_role.team_name" label="Team / Program Name" placeholder="e.g., Outpatient Mental Health Services" />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Role Summary *
                  {isFieldExtracted('about_role.summary') && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                      <Brain className="w-3 h-3 mr-1" />AI
                    </Badge>
                  )}
                </Label>
                <Textarea
                  placeholder="Brief summary: competitive pay, growth opportunities, benefits..."
                  value={template.about_role?.summary || ''}
                  onChange={(e) => updateTemplate('about_role.summary', e.target.value)}
                  rows={2}
                  className={cn(isFieldExtracted('about_role.summary') && 'border-purple-300 bg-purple-50/50')}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Primary Function *
                  {isFieldExtracted('about_role.primary_function') && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                      <Brain className="w-3 h-3 mr-1" />AI
                    </Badge>
                  )}
                </Label>
                <Textarea
                  placeholder="1-2 sentence summary of the primary function and population served"
                  value={template.about_role?.primary_function || ''}
                  onChange={(e) => updateTemplate('about_role.primary_function', e.target.value)}
                  rows={2}
                  className={cn(isFieldExtracted('about_role.primary_function') && 'border-purple-300 bg-purple-50/50')}
                />
              </div>

              <AIField path="about_role.population_served" label="Population Served" placeholder="e.g., adults with mental health needs, children and families" />
            </div>
          )}
        </div>

        {/* Responsibilities */}
        <div className="space-y-4">
          <SectionHeader title="Responsibilities" section="responsibilities" icon={FileText} instruction={sectionInstructions.responsibilities} />
          {expandedSections.responsibilities && (
            <div className="space-y-3 pl-4">
              {(template.responsibilities || ['']).map((resp, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Responsibility #${index + 1}`}
                    value={resp}
                    onChange={(e) => updateListItem('responsibilities', index, e.target.value)}
                    className={cn(isFieldExtracted('responsibilities') && 'border-purple-300 bg-purple-50/50')}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeListItem('responsibilities', index)}
                    disabled={(template.responsibilities?.length || 0) <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addListItem('responsibilities')}>
                <Plus className="w-4 h-4 mr-2" /> Add Responsibility
              </Button>
            </div>
          )}
        </div>

        {/* Qualifications */}
        <div className="space-y-4">
          <SectionHeader title="Required Qualifications" section="qualifications" icon={FileText} instruction={sectionInstructions.qualifications} />
          {expandedSections.qualifications && (
            <div className="space-y-4 pl-4">
              <AIField path="required_qualifications.education" label="Education" placeholder="e.g., Master's degree in Social Work, Psychology, or related field" />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Licensure / Certifications
                  {isFieldExtracted('required_qualifications.licensure') && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                      <Brain className="w-3 h-3 mr-1" />AI
                    </Badge>
                  )}
                </Label>
                {(template.required_qualifications?.licensure || ['']).map((lic, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="e.g., LCSW, LPC, LMFT"
                      value={lic}
                      onChange={(e) => updateListItem('required_qualifications.licensure', index, e.target.value)}
                      className={cn(isFieldExtracted('required_qualifications.licensure') && 'border-purple-300 bg-purple-50/50')}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeListItem('required_qualifications.licensure', index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addListItem('required_qualifications.licensure')}>
                  <Plus className="w-4 h-4 mr-2" /> Add License
                </Button>
              </div>

              <AIField path="required_qualifications.experience_years" label="Years of Experience" placeholder="0" type="number" />

              <div className="space-y-2">
                <Label>Technical / Clinical Skills</Label>
                {(template.required_qualifications?.technical_skills || ['']).map((skill, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="e.g., EMR systems, crisis intervention"
                      value={skill}
                      onChange={(e) => updateListItem('required_qualifications.technical_skills', index, e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeListItem('required_qualifications.technical_skills', index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addListItem('required_qualifications.technical_skills')}>
                  <Plus className="w-4 h-4 mr-2" /> Add Skill
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Benefits */}
        <div className="space-y-4">
          <SectionHeader title="Compensation & Benefits" section="benefits" icon={FileText} instruction={sectionInstructions.benefits} />
          {expandedSections.benefits && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
              {Object.entries(BENEFIT_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={template.benefits?.[key as keyof typeof DEFAULT_BENEFITS] || false}
                    onCheckedChange={(checked) => updateTemplate(`benefits.${key}`, checked)}
                  />
                  <Label htmlFor={key} className="text-sm cursor-pointer">{label}</Label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEO Keywords */}
        <div className="space-y-4">
          <SectionHeader title="SEO Keywords" section="keywords" icon={FileText} instruction={sectionInstructions.keywords} />
          {expandedSections.keywords && (
            <div className="space-y-3 pl-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add keyword..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                />
                <Button variant="outline" onClick={addKeyword}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.seo_keywords?.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(keyword)}>
                    {keyword} <span className="ml-1">&times;</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Type & Actions */}
        <div className="space-y-4 pt-4 border-t">
          {/* Content Type Selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Content Type
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-sm">
                      <strong>Step 4:</strong> Select what you want to create. Job Description uses your form data directly. Other options use AI to generate content.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Select value={selectedContentType} onValueChange={setSelectedContentType}>
              <SelectTrigger className="w-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <SelectValue placeholder="Select content type..." />
              </SelectTrigger>
              <SelectContent className="border-2 border-black">
                {contentTypes.map((type) => (
                  <SelectItem key={type.content_type} value={type.content_type}>
                    <span className="flex items-center gap-2">
                      <span>{type.emoji}</span>
                      <span>{type.content_type}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedContentType && selectedContentType !== 'Job Description' && (
              <p className="text-xs text-gray-500">
                {contentTypes.find(t => t.content_type === selectedContentType)?.tooltip}
              </p>
            )}
          </div>

          {/* Validation Feedback */}
          {!formValidation.isValid && formValidation.missingFields.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Recommended fields missing:</p>
                <p className="text-amber-700">{formValidation.missingFields.join(', ')}</p>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !formValidation.hasMinimumData}
                      className={cn(
                        "w-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
                        formValidation.hasMinimumData
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "bg-gray-400 cursor-not-allowed"
                      )}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate {selectedContentType}
                        </>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!formValidation.hasMinimumData && (
                  <TooltipContent>
                    <p>Fill out at least one field or add context to enable generation</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            {selectedContentType === 'Job Description' && (
              <Button variant="outline" onClick={copyToClipboard} className="border-2 border-black">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Sophisticated Loading Animation Dialog for AI Content */}
      <ContentGenerationDialog
        isOpen={showGenerationDialog}
        onClose={() => !isGenerating && setShowGenerationDialog(false)}
        contentType={selectedContentType}
        isGenerating={isGenerating}
        hasContext={contextItems.length > 0}
        projectName={template.job_title || 'Content'}
      />
      </Card>
    </TooltipProvider>
  );
}

export default ContextBuilder;
