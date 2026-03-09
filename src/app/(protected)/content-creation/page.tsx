'use client';
import dynamic from 'next/dynamic';
const ContentCreationPage = dynamic(() => import('@/views/ContentCreationPage'), { ssr: false });
export default function ContentCreationRoute() { return <ContentCreationPage />; }
