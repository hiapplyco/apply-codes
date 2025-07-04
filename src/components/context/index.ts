// Context Components Export
export { ContextButtons } from './ContextButtons';
export type { ContextButtonsProps } from './ContextButtons';

export { ContextBar } from './ContextBar';
export type { ContextBarProps } from './ContextBar';

// Re-export context integration service and hook
export { ContextIntegrationService } from '@/services/ContextIntegrationService';
export type { 
  ContextContent,
  PipecatContext,
  AgentOrchestrationConfig
} from '@/services/ContextIntegrationService';

export { useContextIntegration } from '@/hooks/useContextIntegration';
export type { 
  UseContextIntegrationProps,
  UseContextIntegrationReturn
} from '@/hooks/useContextIntegration';