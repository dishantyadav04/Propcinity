'use client';

import { useEffect, useState } from "react";
import ProjectForm from "@/components/admin/ProjectForm";
import { Project } from "@/types/project";
import PageLoader from "@/components/ui/PageLoader";
import { useParams } from "next/navigation";

export default function EditProjectPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const res = await fetch('/api/admin/projects', {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Unauthorized');
        const json = await res.json();
        const data = (json.projects || []).find((project: Project) => project.id === id) || null;
        setProject(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProject();
  }, [id]);

  if (isLoading) return <PageLoader />;
  if (!project) return <div>Project not found</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Edit Project</h1>
        <p className="text-sm text-[var(--text-muted)]">Updating audit data for {project.name}</p>
      </div>
      <ProjectForm initialData={project} />
    </div>
  );
}
