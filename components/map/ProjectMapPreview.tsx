'use client';

import dynamic from 'next/dynamic';

interface ProjectMapPreviewProps {
  lat: number;
  lng: number;
  projectName?: string;
  priceLabel?: string;
  height?: string;
  zoom?: number;
}

const ProjectMapInner = dynamic(
  () => import('./ProjectMapInner'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{ height: '320px' }}
        className="w-full rounded-[var(--radius)] bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center"
      >
        <span className="text-xs text-[var(--text-muted)]">Loading map…</span>
      </div>
    ),
  }
);

export default function ProjectMapPreview({
  lat,
  lng,
  projectName,
  priceLabel,
  height = '320px',
  zoom = 15,
}: ProjectMapPreviewProps) {
  return (
    <div
      style={{ height }}
      className="w-full rounded-[var(--radius)] overflow-hidden border border-[var(--border)] relative z-10"
    >
      <ProjectMapInner lat={lat} lng={lng} projectName={projectName} priceLabel={priceLabel} zoom={zoom} />
    </div>
  );
}
