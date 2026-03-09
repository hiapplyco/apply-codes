'use client';
import dynamic from 'next/dynamic';
const Meeting = dynamic(() => import('@/views/MeetingSimplified'), { ssr: false });
export default function MeetingPage() { return <Meeting />; }
