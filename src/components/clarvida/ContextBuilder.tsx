import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { Plus, Minus, FileText, Brain, Trash2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Extracted ContextBuilder modules
import { ContextInputSection } from './ContextBuilder/ContextInputSection';
import { ContextItemsDisplay } from './ContextBuilder/ContextItemsDisplay';
import { ExtractionProgressPanel } from './ContextBuilder/ExtractionProgressPanel';
import { GenerationReadyCard } from './ContextBuilder/GenerationReadyCard';
import { useContextBuilder } from './ContextBuilder/useContextBuilder';
import { AIField } from './ContextBuilder/AIField';
import { SectionHeader } from './ContextBuilder/SectionHeader';
import { useContentGeneration } from './ContextBuilder/useContentGeneration';
import { BENEFIT_LABELS, SECTION_INSTRUCTIONS } from './ContextBuilder/constants';
import { ContextBuilderProps, ContentType } from './ContextBuilder/types';

export function ContextBuilder({ onJobDescriptionGenerated, onContentGenerated, initialTemplate }: ContextBuilderProps) {
  const {
    contextItems, template, extractionState, optimizationState,
    addContextItem, removeContextItem, updateTemplate,
    isFieldExtracted, getFieldSourceInfo, clearAllContext, getNestedValue,
  } = useContextBuilder(initialTemplate);

  const [keywordInput, setKeywordInput] = useState('');
  const [selectedContentType, setSelectedContentType] = useState<string>('Job Description');
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);

  useEffect(() => {
    const loadContentTypes = async () => {
      try {
        const response = await fetch('/data/contentcreationbots.json');
        if (!response.ok) throw new Error('Failed to load content types');
        const data = await response.json();
        setContentTypes(data?.recruiter_hr_content || []);
      } catch (error) {
        console.error('[ContextBuilder] Error loading content types:', error);
        setContentTypes([{ content_type: 'Job Description', emoji: '📄', tooltip: 'Create job descriptions', system_prompt: '' }]);
      }
    };
    loadContentTypes();
  }, []);

  const [expandedSections, setExpandedSections] = useState({
    context: true, basic: true, about: true, responsibilities: true,
    qualifications: true, benefits: false, keywords: false,
  });
  const [isExtractionPanelExpanded, setIsExtractionPanelExpanded] = useState(true);

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const content = useContentGeneration({
    template, contextItems, contentTypes, selectedContentType,
    onJobDescriptionGenerated, onContentGenerated,
  });

  const formValidation = useMemo(() => {
    const missingFields: string[] = [];
    if (!template.job_title?.trim()) missingFields.push('Job Title');
    if (!template.location?.city?.trim()) missingFields.push('City');
    if (!template.location?.state?.trim()) missingFields.push('State');
    const needsMoreContext = selectedContentType !== 'Job Description' &&
      !template.about_role?.summary?.trim() && !template.about_role?.primary_function?.trim();
    if (needsMoreContext) missingFields.push('Role Summary or Primary Function');
    return {
      isValid: missingFields.length === 0,
      missingFields,
      hasMinimumData: !!template.job_title?.trim() || !!template.location?.city?.trim() ||
        !!template.about_role?.summary?.trim() || contextItems.length > 0,
    };
  }, [template, selectedContentType, contextItems.length]);

  const addListItem = useCallback((path: string) => {
    const current = getNestedValue(template, path);
    if (Array.isArray(current)) updateTemplate(path, [...current, '']);
  }, [getNestedValue, template, updateTemplate]);

  const removeListItem = useCallback((path: string, index: number) => {
    const current = getNestedValue(template, path);
    if (Array.isArray(current) && current.length > 1) updateTemplate(path, current.filter((_: any, i: number) => i !== index));
  }, [getNestedValue, template, updateTemplate]);

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
    updateTemplate('seo_keywords', (template.seo_keywords || []).filter((k: string) => k !== keyword));
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
          <p className="text-purple-100 text-sm mt-1">Add context to auto-fill fields, or enter details manually</p>
        </CardHeader>

        <CardContent className="p-6 space-y-6 flex-1 min-h-0 overflow-y-auto">
          {/* Context Input Section */}
          <div className="space-y-4">
            <SectionHeader title="Context Input" section="context" icon={Brain} instruction={SECTION_INSTRUCTIONS.context}
              isExpanded={expandedSections.context} onToggle={() => toggleSection('context')}
              badge={contextItems.length > 0 ? <Badge className="bg-purple-600 text-white text-xs">{contextItems.length} items</Badge> : undefined} />
            {expandedSections.context && (
              <div className="pl-4 space-y-4">
                <ContextInputSection onContextAdded={addContextItem} isExtracting={extractionState.isExtracting} />
                <ContextItemsDisplay items={contextItems} onRemove={removeContextItem} />
                {contextItems.length > 0 && (
                  <ExtractionProgressPanel contextItems={contextItems} extractionState={extractionState} optimizationState={optimizationState}
                    isExpanded={isExtractionPanelExpanded} onToggleExpand={() => setIsExtractionPanelExpanded(!isExtractionPanelExpanded)} />
                )}
                {contextItems.length > 0 && (
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={clearAllContext} className="text-purple-600 hover:text-purple-800 hover:bg-purple-100">
                      <Trash2 className="w-4 h-4 mr-1" /> Clear All Context
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <SectionHeader title="Basic Information" section="basic" icon={FileText} instruction={SECTION_INSTRUCTIONS.basic}
              isExpanded={expandedSections.basic} onToggle={() => toggleSection('basic')} />
            {expandedSections.basic && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                <AIField path="job_title" label="Job Title *" placeholder="e.g., Licensed Clinical Social Worker" value={getNestedValue(template, 'job_title')} isExtracted={isFieldExtracted('job_title')} sourceInfo={getFieldSourceInfo('job_title')} onUpdate={updateTemplate} />
                <AIField path="specialty_credential" label="Specialty / Credential" placeholder="e.g., LCSW, LPC, RN" value={getNestedValue(template, 'specialty_credential')} isExtracted={isFieldExtracted('specialty_credential')} sourceInfo={getFieldSourceInfo('specialty_credential')} onUpdate={updateTemplate} />
                <AIField path="location.city" label="City *" placeholder="e.g., Denver" value={getNestedValue(template, 'location.city')} isExtracted={isFieldExtracted('location.city')} sourceInfo={getFieldSourceInfo('location.city')} onUpdate={updateTemplate} />
                <AIField path="location.state" label="State *" placeholder="e.g., CO" value={getNestedValue(template, 'location.state')} isExtracted={isFieldExtracted('location.state')} sourceInfo={getFieldSourceInfo('location.state')} onUpdate={updateTemplate} />

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Work Arrangement
                    {isFieldExtracted('location.work_arrangement') && <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200"><Brain className="w-3 h-3 mr-1" />AI</Badge>}
                  </Label>
                  <Select value={template.location?.work_arrangement || 'On-site'} onValueChange={(value) => updateTemplate('location.work_arrangement', value)}>
                    <SelectTrigger className={cn(isFieldExtracted('location.work_arrangement') && 'border-purple-300 bg-purple-50/50')}><SelectValue /></SelectTrigger>
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
                    {isFieldExtracted('employment_type') && <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200"><Brain className="w-3 h-3 mr-1" />AI</Badge>}
                  </Label>
                  <Select value={template.employment_type || 'Full-time'} onValueChange={(value) => updateTemplate('employment_type', value)}>
                    <SelectTrigger className={cn(isFieldExtracted('employment_type') && 'border-purple-300 bg-purple-50/50')}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Salary Type</Label>
                  <Select value={template.salary?.type || 'hourly'} onValueChange={(value) => updateTemplate('salary.type', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <AIField path="salary.min" label={`Min ${template.salary?.type === 'hourly' ? '$/hr' : '$/yr'}`} placeholder="0" type="number" value={getNestedValue(template, 'salary.min')} isExtracted={isFieldExtracted('salary.min')} sourceInfo={getFieldSourceInfo('salary.min')} onUpdate={updateTemplate} />
                  <AIField path="salary.max" label={`Max ${template.salary?.type === 'hourly' ? '$/hr' : '$/yr'}`} placeholder="0" type="number" value={getNestedValue(template, 'salary.max')} isExtracted={isFieldExtracted('salary.max')} sourceInfo={getFieldSourceInfo('salary.max')} onUpdate={updateTemplate} />
                </div>
              </div>
            )}
          </div>

          {/* About the Role */}
          <div className="space-y-4">
            <SectionHeader title="About the Role" section="about" icon={FileText} instruction={SECTION_INSTRUCTIONS.about}
              isExpanded={expandedSections.about} onToggle={() => toggleSection('about')} />
            {expandedSections.about && (
              <div className="space-y-4 pl-4">
                <AIField path="about_role.team_name" label="Team / Program Name" placeholder="e.g., Outpatient Mental Health Services" value={getNestedValue(template, 'about_role.team_name')} isExtracted={isFieldExtracted('about_role.team_name')} sourceInfo={getFieldSourceInfo('about_role.team_name')} onUpdate={updateTemplate} />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">Role Summary * {isFieldExtracted('about_role.summary') && <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200"><Brain className="w-3 h-3 mr-1" />AI</Badge>}</Label>
                  <Textarea placeholder="Brief summary: competitive pay, growth opportunities, benefits..." value={template.about_role?.summary || ''} onChange={(e) => updateTemplate('about_role.summary', e.target.value)} rows={2} className={cn(isFieldExtracted('about_role.summary') && 'border-purple-300 bg-purple-50/50')} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">Primary Function * {isFieldExtracted('about_role.primary_function') && <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200"><Brain className="w-3 h-3 mr-1" />AI</Badge>}</Label>
                  <Textarea placeholder="1-2 sentence summary of the primary function and population served" value={template.about_role?.primary_function || ''} onChange={(e) => updateTemplate('about_role.primary_function', e.target.value)} rows={2} className={cn(isFieldExtracted('about_role.primary_function') && 'border-purple-300 bg-purple-50/50')} />
                </div>
                <AIField path="about_role.population_served" label="Population Served" placeholder="e.g., adults with mental health needs" value={getNestedValue(template, 'about_role.population_served')} isExtracted={isFieldExtracted('about_role.population_served')} sourceInfo={getFieldSourceInfo('about_role.population_served')} onUpdate={updateTemplate} />
              </div>
            )}
          </div>

          {/* Responsibilities */}
          <div className="space-y-4">
            <SectionHeader title="Responsibilities" section="responsibilities" icon={FileText} instruction={SECTION_INSTRUCTIONS.responsibilities}
              isExpanded={expandedSections.responsibilities} onToggle={() => toggleSection('responsibilities')} />
            {expandedSections.responsibilities && (
              <div className="space-y-3 pl-4">
                {(template.responsibilities || ['']).map((resp: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input placeholder={`Responsibility #${index + 1}`} value={resp} onChange={(e) => updateListItem('responsibilities', index, e.target.value)} className={cn(isFieldExtracted('responsibilities') && 'border-purple-300 bg-purple-50/50')} />
                    <Button variant="ghost" size="icon" onClick={() => removeListItem('responsibilities', index)} disabled={(template.responsibilities?.length || 0) <= 1}><Minus className="w-4 h-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addListItem('responsibilities')}><Plus className="w-4 h-4 mr-2" /> Add Responsibility</Button>
              </div>
            )}
          </div>

          {/* Qualifications */}
          <div className="space-y-4">
            <SectionHeader title="Required Qualifications" section="qualifications" icon={FileText} instruction={SECTION_INSTRUCTIONS.qualifications}
              isExpanded={expandedSections.qualifications} onToggle={() => toggleSection('qualifications')} />
            {expandedSections.qualifications && (
              <div className="space-y-4 pl-4">
                <AIField path="required_qualifications.education" label="Education" placeholder="e.g., Master's degree in Social Work" value={getNestedValue(template, 'required_qualifications.education')} isExtracted={isFieldExtracted('required_qualifications.education')} sourceInfo={getFieldSourceInfo('required_qualifications.education')} onUpdate={updateTemplate} />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">Licensure / Certifications {isFieldExtracted('required_qualifications.licensure') && <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200"><Brain className="w-3 h-3 mr-1" />AI</Badge>}</Label>
                  {(template.required_qualifications?.licensure || ['']).map((lic: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input placeholder="e.g., LCSW, LPC, LMFT" value={lic} onChange={(e) => updateListItem('required_qualifications.licensure', index, e.target.value)} className={cn(isFieldExtracted('required_qualifications.licensure') && 'border-purple-300 bg-purple-50/50')} />
                      <Button variant="ghost" size="icon" onClick={() => removeListItem('required_qualifications.licensure', index)}><Minus className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addListItem('required_qualifications.licensure')}><Plus className="w-4 h-4 mr-2" /> Add License</Button>
                </div>
                <AIField path="required_qualifications.experience_years" label="Years of Experience" placeholder="0" type="number" value={getNestedValue(template, 'required_qualifications.experience_years')} isExtracted={isFieldExtracted('required_qualifications.experience_years')} sourceInfo={getFieldSourceInfo('required_qualifications.experience_years')} onUpdate={updateTemplate} />
                <div className="space-y-2">
                  <Label>Technical / Clinical Skills</Label>
                  {(template.required_qualifications?.technical_skills || ['']).map((skill: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input placeholder="e.g., EMR systems, crisis intervention" value={skill} onChange={(e) => updateListItem('required_qualifications.technical_skills', index, e.target.value)} />
                      <Button variant="ghost" size="icon" onClick={() => removeListItem('required_qualifications.technical_skills', index)}><Minus className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addListItem('required_qualifications.technical_skills')}><Plus className="w-4 h-4 mr-2" /> Add Skill</Button>
                </div>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <SectionHeader title="Compensation & Benefits" section="benefits" icon={FileText} instruction={SECTION_INSTRUCTIONS.benefits}
              isExpanded={expandedSections.benefits} onToggle={() => toggleSection('benefits')} />
            {expandedSections.benefits && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                {Object.entries(BENEFIT_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox id={key} checked={(template.benefits as Record<string, boolean>)?.[key] || false} onCheckedChange={(checked) => updateTemplate(`benefits.${key}`, checked)} />
                    <Label htmlFor={key} className="text-sm cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEO Keywords */}
          <div className="space-y-4">
            <SectionHeader title="SEO Keywords" section="keywords" icon={FileText} instruction={SECTION_INSTRUCTIONS.keywords}
              isExpanded={expandedSections.keywords} onToggle={() => toggleSection('keywords')} />
            {expandedSections.keywords && (
              <div className="space-y-3 pl-4">
                <div className="flex gap-2">
                  <Input placeholder="Add keyword..." value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addKeyword()} />
                  <Button variant="outline" onClick={addKeyword}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {template.seo_keywords?.map((keyword: string) => (
                    <Badge key={keyword} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(keyword)}>
                      {keyword} <span className="ml-1">&times;</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Generation Ready Card */}
          <div className="pt-4 border-t">
            <GenerationReadyCard template={template} contextItemsCount={contextItems.length} contentTypes={contentTypes}
              selectedContentType={selectedContentType} onContentTypeChange={setSelectedContentType}
              onGenerate={() => content.handleGenerate(formValidation)} isGenerating={content.isGenerating} isExtracting={extractionState.isExtracting} />
          </div>
        </CardContent>

        <ContentGenerationDialog isOpen={content.showGenerationDialog} onClose={() => !content.isGenerating && content.setShowGenerationDialog(false)}
          contentType={selectedContentType} isGenerating={content.isGenerating} hasContext={contextItems.length > 0} projectName={template.job_title || 'Content'} />
      </Card>
    </TooltipProvider>
  );
}

export default ContextBuilder;
