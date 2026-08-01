'use client';

import dynamic from 'next/dynamic';

interface AdminMapPreviewProps {
  lat: number;
  lng: number;
}

const AdminMapPreviewInner = dynamic(
  () => import('@/components/map/ProjectMapInner'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] w-full rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center">
        <span className="text-xs text-[var(--text-muted)]">Loading map…</span>
      </div>
    ),
  }
);

export default function AdminMapPreview({ lat, lng }: AdminMapPreviewProps) {
  return (
    <div className="h-[200px] w-full rounded-lg overflow-hidden border border-[var(--border)] relative z-10" style={{ touchAction: 'pan-y' }}>
      <AdminMapPreviewInner lat={lat} lng={lng} />
    </div>
  );
}
