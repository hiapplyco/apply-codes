import React from 'react';
import { StepLoadingDialog, LOADING_PRESETS } from '@/components/ui/StepLoadingDialog';

interface BooleanGenerationAnimationProps {
  isOpen: boolean;
  onComplete?: () => void;
  estimatedTimeMs?: number;
}

export const BooleanGenerationAnimation: React.FC<BooleanGenerationAnimationProps> = ({
  isOpen,
  onComplete,
  estimatedTimeMs = 120000
}) => {
  return (
    <StepLoadingDialog
      isOpen={isOpen}
      onClose={() => onComplete?.()}
      title={LOADING_PRESETS.booleanGeneration.title}
      subtitle="Our AI is crafting the perfect search query for you"
      steps={LOADING_PRESETS.booleanGeneration.steps}
      isLoading={isOpen}
      allowCloseWhileLoading={false}
    />
  );
};
