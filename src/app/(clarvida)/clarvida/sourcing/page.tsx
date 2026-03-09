'use client';
import dynamic from 'next/dynamic';
const SourcingContent = dynamic(() => import('./sourcing-client'), { ssr: false });
export default function ClarvidaSourcingPage() { return <SourcingContent />; }
