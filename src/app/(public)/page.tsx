'use client';
import dynamic from 'next/dynamic';
const Index = dynamic(() => import('@/views/Index'), { ssr: false });
export default function HomePage() { return <Index />; }
