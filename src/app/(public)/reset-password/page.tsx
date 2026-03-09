'use client';
import dynamic from 'next/dynamic';
const PasswordReset = dynamic(() => import('@/views/PasswordReset'), { ssr: false });
export default function ResetPasswordPage() { return <PasswordReset />; }
