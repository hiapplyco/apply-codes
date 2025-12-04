import React from 'react';
import { StepLoadingDialog } from '@/components/ui/StepLoadingDialog';
import { Brain, Sparkles, Search } from 'lucide-react';

interface GeneratingAnimationProps {
  isOpen: boolean;
  stage?: 'generating' | 'explaining' | 'searching';
  message?: string;
}

// Stage-specific configurations
const STAGE_CONFIG = {
  generating: {
    title: 'AI is Thinking',
    subtitle: 'Analyzing requirements and generating optimal boolean search',
    steps: [
      { icon: Brain, title: 'Identifying Skills', description: 'Finding key skills and technologies...' },
      { title: 'Analyzing Titles', description: 'Finding job title variations...' },
      { title: 'Building Query', description: 'Adding location and experience filters...' }
    ]
  },
  explaining: {
    title: 'Creating Explanation',
    subtitle: 'Breaking down your search strategy',
    steps: [
      { icon: Sparkles, title: 'Analyzing Components', description: 'Explaining each search component...' },
      { title: 'Highlighting Matches', description: 'What will be included in results...' },
      { title: 'Adding Tips', description: 'Providing optimization suggestions...' }
    ]
  },
  searching: {
    title: 'Searching LinkedIn',
    subtitle: 'Finding the best candidates for you',
    steps: [
      { icon: Search, title: 'Scanning Profiles', description: 'Searching LinkedIn profiles...' },
      { title: 'Matching Criteria', description: 'Evaluating against your requirements...' },
      { title: 'Organizing Results', description: 'Sorting by relevance...' }
    ]
  }
};

export const GeneratingAnimation: React.FC<GeneratingAnimationProps> = ({
  isOpen,
  stage = 'generating',
  message
}) => {
  const config = STAGE_CONFIG[stage];

  return (
    <StepLoadingDialog
      isOpen={isOpen}
      onClose={() => {}}
      title={config.title}
      subtitle={message || config.subtitle}
      steps={config.steps}
      isLoading={isOpen}
      allowCloseWhileLoading={false}
    />
  );
};
