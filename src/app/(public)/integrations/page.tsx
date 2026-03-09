'use client';
import dynamic from 'next/dynamic';
const MarketingIntegrations = dynamic(() => import('@/views/MarketingIntegrations'), { ssr: false });
export default function IntegrationsPage() { return <MarketingIntegrations />; }
