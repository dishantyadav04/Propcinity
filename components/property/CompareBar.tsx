'use client';

import { useEffect, useState } from "react";
import { Project } from "@/types/project";
import { X, ArrowRight, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function CompareBar() {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchCompareData = () => {
    const ids = JSON.parse(localStorage.getItem('compareIds') || '[]');
    setCompareIds(ids);
    
    if (ids.length > 0) {
      fetch('/api/projects')
        .then(r => r.json())
        .then((data: Project[]) => {
          setProjects(data.filter(p => ids.includes(p.id)));
        });
    } else {
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchCompareData();
    window.addEventListener('compareUpdated', fetchCompareData);
    return () => window.removeEventListener('compareUpdated', fetchCompareData);
  }, []);

  const handleRemove = (id: string) => {
    const next = compareIds.filter(i => i !== id);
    localStorage.setItem('compareIds', JSON.stringify(next));
    window.dispatchEvent(new Event('compareUpdated'));
  };

  if (compareIds.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-[72px] md:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-32px)] max-w-2xl"
      >
        <div className="bg-[var(--surface-dark)] text-white rounded-[var(--radius-lg)] shadow-2xl p-4 flex items-center gap-4 border border-white/10 backdrop-blur-md">
          <div className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {projects.map(p => (
              <div key={p.id} className="flex-shrink-0 flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl group">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/20">
                  {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />}
                </div>
                <div className="max-w-[100px]">
                  <p className="text-[10px] font-bold truncate">{p.name}</p>
                </div>
                <button onClick={() => handleRemove(p.id)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {[...Array(Math.max(0, 3 - projects.length))].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-32 h-12 border border-dashed border-white/20 rounded-xl flex items-center justify-center">
                <p className="text-[10px] text-white/40 font-bold">+ Add Project</p>
              </div>
            ))}
          </div>

          <div className="h-10 w-px bg-white/10 mx-2" />

          <Link 
            href="/compare" 
            className="flex-shrink-0 bg-[var(--primary)] text-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-[var(--shadow-primary)] hover:scale-105 transition-transform"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Compare</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
