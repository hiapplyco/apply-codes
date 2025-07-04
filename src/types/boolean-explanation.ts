export interface BooleanExplanation {
  summary: string;
  structure: {
    primaryTarget: string;
    breakdown: Array<{
      component: string;
      operator: 'AND' | 'OR' | 'NOT';
      meaning: string;
      examples: string[];
      visual: 'primary' | 'secondary' | 'exclude';
    }>;
  };
  locationLogic: {
    areas: string[];
    explanation: string;
  };
  exclusions: {
    terms: string[];
    reason: string;
  };
  tips: string[];
}