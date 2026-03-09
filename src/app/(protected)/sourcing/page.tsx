'use client';
import dynamic from 'next/dynamic';
const Sourcing = dynamic(() => import('@/views/Sourcing'), { ssr: false });
export default function SourcingPage() { return <Sourcing />; }
