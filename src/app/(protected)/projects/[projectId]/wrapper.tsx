'use client';
import dynamic from 'next/dynamic';
const ProjectDetailClient = dynamic(() => import('./client'), { ssr: false });
export default function ProjectDetailWrapper() { return <ProjectDetailClient />; }
