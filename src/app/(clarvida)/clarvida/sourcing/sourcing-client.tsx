'use client';
import ClarvidaSourcing from '@/views/ClarvidaSourcing';
import { ClarvidaProtectedRoute } from '@/components/clarvida/ClarvidaProtectedRoute';
export default function SourcingClient() { return <ClarvidaProtectedRoute><ClarvidaSourcing /></ClarvidaProtectedRoute>; }
