'use client';
import dynamic from 'next/dynamic';
const ClarvidaLogin = dynamic(() => import('@/views/ClarvidaLogin'), { ssr: false });
export default function ClarvidaLoginPage() { return <ClarvidaLogin />; }
