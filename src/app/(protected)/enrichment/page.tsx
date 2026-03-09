'use client';
import dynamic from 'next/dynamic';
const ProfileEnrichment = dynamic(() => import('@/views/ProfileEnrichment'), { ssr: false });
export default function EnrichmentPage() { return <ProfileEnrichment />; }
