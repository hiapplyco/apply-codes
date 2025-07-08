declare global {
  interface Window {
    plausible: (eventName: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

export const trackEvent = (eventName: string, props?: Record<string, string | number>) => {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(eventName, { props });
  }
};

export const trackPageView = (url?: string) => {
  if (typeof window !== 'undefined' && window.plausible) {
    const currentUrl = url || window.location.pathname;
    window.plausible('pageview', { props: { url: currentUrl } });
  }
};

export const trackFormSubmit = (formName: string, success: boolean) => {
  trackEvent(`Form Submit: ${formName}`, { success: success ? 1 : 0 });
};

export const trackUserEngagement = (action: string, category: string, value?: number) => {
  const props: Record<string, string | number> = { category };
  if (value !== undefined) {
    props.value = value;
  }
  trackEvent(`User Engagement: ${action}`, props);
};

export const trackSearch = (searchTerm: string, resultsCount: number) => {
  trackEvent('Search', { term: searchTerm, results: resultsCount });
};

export const trackError = (errorType: string, errorMessage: string) => {
  trackEvent('Error', { type: errorType, message: errorMessage });
};

export const trackTiming = (category: string, variable: string, timeInMs: number) => {
  trackEvent(`Timing: ${category}`, { variable, time: timeInMs });
};

export const trackSocialShare = (platform: string, contentType: string) => {
  trackEvent('Social Share', { platform, contentType });
};

export const trackConversion = (type: string, value?: number) => {
  const props: Record<string, string | number> = { type };
  if (value !== undefined) {
    props.value = value;
  }
  trackEvent('Conversion', props);
};

// Apply.codes specific tracking functions
export const trackJobApplication = (jobId: string, company: string) => {
  trackEvent('Job Application', { jobId, company });
};

export const trackRecruiterSignup = (success: boolean) => {
  trackFormSubmit('Recruiter Signup', success);
};

export const trackCandidateSearch = (searchType: string, resultsCount: number, filters?: Record<string, string>) => {
  const props: Record<string, string | number> = {
    searchType,
    results: resultsCount,
    ...filters
  };
  trackEvent('Candidate Search', props);
};

export const trackBooleanGeneration = (input: string, success: boolean) => {
  trackEvent('Boolean Generation', { 
    inputLength: input.length, 
    success: success ? 1 : 0 
  });
};

export const trackProfileEnrichment = (candidateId: string, success: boolean) => {
  trackEvent('Profile Enrichment', { 
    candidateId, 
    success: success ? 1 : 0 
  });
};

export const trackVideoMeeting = (action: 'start' | 'join' | 'end', meetingId: string) => {
  trackEvent('Video Meeting', { action, meetingId });
};

export const trackReferral = (source: string) => {
  trackEvent('Referral', { source });
};

export const trackAgentUsage = (agentType: string, success: boolean, processingTime?: number) => {
  const props: Record<string, string | number> = {
    agentType,
    success: success ? 1 : 0
  };
  if (processingTime !== undefined) {
    props.processingTime = processingTime;
  }
  trackEvent('Agent Usage', props);
};