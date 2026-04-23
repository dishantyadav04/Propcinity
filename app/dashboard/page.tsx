'use client';

import { useEffect, useState } from "react";
import { Project } from "@/types/project";
import ProjectCard from "@/components/property/ProjectCard";
import PersonalizedWelcome from "@/components/onboarding/PersonalizedWelcome";
import PageLoader from "@/components/ui/PageLoader";
import SectionContainer from "@/components/layout/SectionContainer";
import { generateFitReasons } from "@/services/fit-analysis";
import { UserIntent } from "@/types/user";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [intent, setIntent] = useState<UserIntent | null>(null);
  const [fitScores, setFitScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const savedIntent = localStorage.getItem('userIntent');
    if (savedIntent) setIntent(JSON.parse(savedIntent));

    const loadProjects = async () => {
      try {
        const savedIntent = localStorage.getItem('userIntent');
        const intent = savedIntent ? JSON.parse(savedIntent) : null;
        const params = new URLSearchParams();
        if (intent?.budget?.min) params.set('budgetMin', intent.budget.min);
        if (intent?.budget?.max) params.set('budgetMax', intent.budget.max);
        if (intent?.propertyType?.length) params.set('types', intent.propertyType.join(','));

        const res = await fetch(`/api/projects?${params.toString()}`);
        if (!res.ok) throw new Error('Failed');
        const data: Project[] = await res.json();
        setProjects(data);

        if (intent) {
          const scores: Record<string, number> = {};
          data.forEach(p => {
            scores[p.id] = generateFitReasons(p, p.unitConfigs[0] || null, intent).score;
          });
          setFitScores(scores);
        }
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
    <div className="min-h-screen bg-[var(--background)]">
      <PersonalizedWelcome />
      
      <SectionContainer wide className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Curated For You
          </h2>
          <span className="text-xs text-[var(--primary)] font-bold uppercase tracking-widest">{projects.length} results</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              fitScore={fitScores[project.id] ?? project.trustScore}
              index={index}
            />
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="text-4xl">🏢</div>
            <p className="text-[var(--text-secondary)]">No projects found for your preferences. Try adjusting your budget.</p>
          </div>
        )}
      </SectionContainer>
    </div>
  );
}
