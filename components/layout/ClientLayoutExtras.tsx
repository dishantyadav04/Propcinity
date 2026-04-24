'use client';

import dynamic from 'next/dynamic';

const CompareBar = dynamic(() => import('@/components/property/CompareBar'), { ssr: false });

export default function ClientLayoutExtras() {
  return <CompareBar />;
}
