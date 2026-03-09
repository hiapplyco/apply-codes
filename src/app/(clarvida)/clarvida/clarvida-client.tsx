'use client';
import Clarvida from '@/views/Clarvida';
import { ClarvidaProtectedRoute } from '@/components/clarvida/ClarvidaProtectedRoute';
export default function ClarvidaClient() { return <ClarvidaProtectedRoute><Clarvida /></ClarvidaProtectedRoute>; }
