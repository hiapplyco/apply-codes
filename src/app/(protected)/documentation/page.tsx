'use client';
import dynamic from 'next/dynamic';
const Documentation = dynamic(() => import('@/views/Documentation'), { ssr: false });
export default function DocumentationPage() { return <Documentation />; }
