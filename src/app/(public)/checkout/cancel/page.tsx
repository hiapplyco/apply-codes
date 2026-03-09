'use client';
import dynamic from 'next/dynamic';
const CheckoutCancel = dynamic(() => import('@/views/CheckoutCancel'), { ssr: false });
export default function CheckoutCancelPage() { return <CheckoutCancel />; }
