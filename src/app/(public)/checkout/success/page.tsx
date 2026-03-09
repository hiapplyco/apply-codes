'use client';
import dynamic from 'next/dynamic';
const CheckoutSuccess = dynamic(() => import('@/views/CheckoutSuccess'), { ssr: false });
export default function CheckoutSuccessPage() { return <CheckoutSuccess />; }
