'use client'

import { useEffect, useRef, useState } from 'react'

export interface FormSection {
  id: string
  label: string
}

export default function ProjectFormSectionNav({ sections }: { sections: FormSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const elements = sections
      .map(s => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null)

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]?.target.id) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
    )

    elements.forEach(el => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [sections])

  const activeIndex = sections.findIndex(s => s.id === activeId)

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="sticky top-14 md:top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 mb-6 bg-[var(--surface)] border-b border-[var(--border)] shadow-sm">
      <div className="flex items-center gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8 py-2.5 scrollbar-hide">
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mr-2 flex-shrink-0">
          {activeIndex >= 0 ? activeIndex + 1 : 1}/{sections.length}
        </span>
        {sections.map(section => (
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
