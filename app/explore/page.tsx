'use client';

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Project } from "@/types/project";
import PageLoader from "@/components/ui/PageLoader";
import Skeleton from "@/components/ui/Skeleton";
import ProjectCard from "@/components/property/ProjectCard";
import { formatINR } from "@/lib/finance-calculations";

const MapView = dynamic(() => import("@/components/map/MapView"), { 
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />
});

export default function ExplorePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch('/api/projects');
        if (!res.ok) throw new Error('Failed');
        const data: Project[] = await res.json();
        setProjects(data);
        if (data.length > 0) setSelectedProject(data[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProjects();
  }, []);

  if (isLoading) return <PageLoader />;

  return (
    <div className="h-[calc(100vh-64px-env(safe-area-inset-bottom))] flex flex-col">
      {/* Map Header */}
      <div className="flex-1 relative">
        <MapView 
          lat={selectedProject?.lat || 18.5204}
          lng={selectedProject?.lng || 73.8567}
          projectName={selectedProject?.name || "Pune"}
          priceLabel={selectedProject ? formatINR(Math.min(...selectedProject.unitConfigs.map(u => u.priceMin))) : "Projects"}
          zoom={12}
          className="h-full w-full"
        />
      </div>

      {/* Horizontal List */}
      <div className="bg-[var(--surface)] border-t border-[var(--border)] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">
            {projects.length} Projects in Pune
          </h2>
          <button className="text-xs text-[var(--primary)] font-bold uppercase">Filter</button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="flex-shrink-0 w-[280px] snap-center"
              onClick={() => setSelectedProject(project)}
            >
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
