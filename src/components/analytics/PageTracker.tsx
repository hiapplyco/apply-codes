import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackReferral } from '@/lib/analytics';

export function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page view
    trackPageView(location.pathname);

    // Check for referral tracking
    const searchParams = new URLSearchParams(location.search);
    const referralSource = searchParams.get('ref');
    const utmSource = searchParams.get('utm_source');
    
    if (referralSource) {
      trackReferral(referralSource);
    } else if (utmSource) {
      trackReferral(utmSource);
    }
    
    // Special case for hiapply.co referrals
    if (referralSource === 'hiapply' || utmSource === 'hiapply.co') {
      trackReferral('hiapply.co');
    }
  }, [location]);

  return null;
}