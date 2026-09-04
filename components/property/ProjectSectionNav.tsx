'use client'

import { useEffect, useRef, useState } from 'react'

export interface ProjectNavSection {
  id: string
  label: string
}

const SECTIONS: ProjectNavSection[] = [
  { id: 'section-overview', label: 'Overview' },
  { id: 'section-location', label: 'Location' },
  { id: 'section-amenities', label: 'Amenities' },
  { id: 'section-floor-plans', label: 'Floor Plans' },
  { id: 'section-pricing', label: 'Pricing' },
  { id: 'section-pros-cons', label: 'Pros & Cons' },
  { id: 'section-legal', label: 'Legal' },
  { id: 'section-rera', label: 'RERA' },
  { id: 'section-builder', label: 'Builder' },
]

export default function ProjectSectionNav() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const elements = SECTIONS
      .map(s => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null)

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]?.target.id) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-160px 0px -70% 0px', threshold: 0 }
    )

    elements.forEach(el => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="sticky top-16 z-30 -mx-4 sm:mx-0 bg-[var(--surface)] border-b border-[var(--border)] shadow-sm">
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-2.5 scrollbar-hide max-w-6xl mx-auto">
        {SECTIONS.map(section => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollToSection(section.id)}
            className={`flex-shrink-0 whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              activeId === section.id
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>
    </div>
  )
}
