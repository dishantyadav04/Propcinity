'use client';

import { useEffect, useState } from 'react';
import BuilderForm from '@/components/admin/BuilderForm';
import { useParams } from 'next/navigation';
import { adminFetch } from '@/lib/admin-fetch';

export default function EditBuilderPage() {
  const params = useParams();
  const id = params?.id as string;
  const [builder, setBuilder] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    adminFetch('/api/admin/builders')
      .then(r => r.json())
      .then(d => {
        const found = (d.builders || []).find((b: any) => b.id === id);
        setBuilder(found || null);
      });
  }, [id]);

  if (!builder) return <div className="p-8 text-[var(--text-muted)]">Loading...</div>;
  return <BuilderForm mode="edit" initial={builder} />;
}
