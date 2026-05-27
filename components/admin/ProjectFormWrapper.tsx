'use client';

import dynamic from 'next/dynamic';

const ProjectForm = dynamic(() => import("@/components/admin/ProjectForm"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)] animate-pulse" />
  ),
});

export default function ProjectFormWrapper() {
  return <ProjectForm />;
}
