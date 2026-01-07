import React, { useMemo } from 'react';
import { StepLoadingDialog, LoadingStep, LOADING_PRESETS } from './StepLoadingDialog';

export interface ContentGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: string;
  isGenerating: boolean;
  hasContext?: boolean;
  projectName?: string;
}

/**
 * A specialized loading dialog for content generation that automatically
 * configures steps based on the content type being generated.
 */
export const ContentGenerationDialog: React.FC<ContentGenerationDialogProps> = ({
  isOpen,
  onClose,
  contentType,
  isGenerating,
  hasContext = false,
  projectName = 'Content'
}) => {
  // Generate steps based on content type
  const config = useMemo(() => {
    const baseSteps: LoadingStep[] = [
      { title: 'Analyzing Context', description: 'Processing your job details and requirements...' },
      { title: 'Generating Content', description: `Creating your ${contentType} with AI assistance...` },
      { title: 'Finalizing', description: 'Applying formatting and optimization...' }
    ];

    // Customize based on content type
    switch (contentType) {
      case 'LinkedIn Job Post':
        return {
          title: 'Creating LinkedIn Post',
          subtitle: `Generating professional content for ${projectName}`,
          steps: [
            { title: 'Analyzing Context', description: 'Processing your job details...' },
            { title: 'Generating Content', description: 'Creating engaging LinkedIn content...' },
            { title: 'Creating Image', description: 'Generating branded visual for your post...' },
            { title: 'Finalizing', description: 'Optimizing for LinkedIn engagement...' }
          ] as LoadingStep[]
        };

      case 'Cold Outreach Email':
        return {
          title: 'Crafting Outreach Email',
          subtitle: `Creating personalized email for ${projectName}`,
          steps: [
            { title: 'Analyzing Role', description: 'Understanding the position requirements...' },
            { title: 'Generating Email', description: 'Creating compelling outreach content...' },
            { title: 'Personalizing', description: 'Adding personal touches and call-to-action...' }
          ] as LoadingStep[]
        };

      case 'Interview Questions':
        return {
          title: 'Generating Interview Questions',
          subtitle: `Creating questions for ${projectName}`,
          steps: [
            { title: 'Analyzing Requirements', description: 'Reviewing job qualifications...' },
            { title: 'Generating Questions', description: 'Creating targeted interview questions...' },
            { title: 'Adding Criteria', description: 'Including evaluation guidelines...' }
          ] as LoadingStep[]
        };

      case 'Rejection Letter':
        return {
          title: 'Creating Rejection Letter',
          subtitle: 'Crafting a professional and empathetic response',
          steps: [
            { title: 'Preparing Template', description: 'Setting up letter structure...' },
            { title: 'Generating Content', description: 'Creating thoughtful rejection content...' },
            { title: 'Finalizing', description: 'Ensuring professional tone...' }
          ] as LoadingStep[]
        };

      case 'Offer Letter':
        return {
          title: 'Creating Offer Letter',
          subtitle: `Preparing offer for ${projectName}`,
          steps: [
            { title: 'Preparing Template', description: 'Setting up offer letter structure...' },
            { title: 'Generating Content', description: 'Creating formal offer details...' },
            { title: 'Finalizing', description: 'Adding placeholders and formatting...' }
          ] as LoadingStep[]
        };

      default:
        return {
          title: `Creating ${contentType}`,
          subtitle: projectName ? `Generating content for ${projectName}` : undefined,
          steps: baseSteps
        };
    }
  }, [contentType, projectName]);

  return (
    <StepLoadingDialog
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      subtitle={config.subtitle}
      steps={config.steps}
      isLoading={isGenerating}
      hasContext={hasContext}
      contextMessage={hasContext ? 'Using uploaded context for better results' : undefined}
      stepInterval={1800}
      allowCloseWhileLoading={false}
    />
  );
};

export default ContentGenerationDialog;
