'use client';
import dynamic from 'next/dynamic';
const ClarvidaContent = dynamic(() => import('./clarvida-client'), { ssr: false });
export default function ClarvidaPage() { return <ClarvidaContent />; }
