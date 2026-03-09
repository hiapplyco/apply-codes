'use client';
import dynamic from 'next/dynamic';
const ReportClient = dynamic(() => import('./client'), { ssr: false });
export default function ReportWrapper() { return <ReportClient />; }
