'use client';
import dynamic from 'next/dynamic';
const JobEditorClient = dynamic(() => import('./client'), { ssr: false });
export default function JobEditorWrapper() { return <JobEditorClient />; }
