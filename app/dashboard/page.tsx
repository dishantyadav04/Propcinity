'use client';

import { useEffect, useState } from "react";
import { Project } from "@/types/project";
import ProjectCard from "@/components/property/ProjectCard";
import PersonalizedWelcome from "@/components/onboarding/PersonalizedWelcome";
import PageLoader from "@/components/ui/PageLoader";
import SectionContainer from "@/components/layout/SectionContainer";
import { getPublishedProjects } from "@/services/projects";
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
        const data = await getPublishedProjects();
        setProjects(data);
        const savedIntent = localStorage.getItem('userIntent');
        if (savedIntent) {
          const intent = JSON.parse(savedIntent);
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
      
      <SectionContainer className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Curated For You
          </h2>
          <span className="text-xs text-[var(--primary)] font-bold uppercase tracking-widest">{projects.length} results</span>
        </div>

        <div className="space-y-6">
          {projects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              fitScore={fitScores[project.id] ?? project.trustScore}
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
