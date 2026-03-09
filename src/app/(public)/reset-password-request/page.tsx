'use client';
import dynamic from 'next/dynamic';
const ResetPasswordRequest = dynamic(() => import('@/views/ResetPasswordRequest'), { ssr: false });
export default function ResetPasswordRequestPage() { return <ResetPasswordRequest />; }
