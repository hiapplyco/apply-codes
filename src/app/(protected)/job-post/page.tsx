'use client';
import dynamic from 'next/dynamic';
const JobPostingPage = dynamic(() => import('@/components/jobs/JobPostingPage').then(m => ({ default: m.JobPostingPage })), { ssr: false });
export default function JobPostPage() { return <JobPostingPage />; }
