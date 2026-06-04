'use client';

import dynamic from 'next/dynamic';
import Skeleton from '@/components/ui/Skeleton';

interface MapViewProps {
  lat: number;
  lng: number;
  projectName: string;
  priceLabel: string;
  zoom?: number;
  className?: string;
}

const ProjectMapInner = dynamic(
  () => import('./ProjectMapInner'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full rounded-[var(--radius)]" />,
  }
);

export default function MapView({ lat, lng, projectName, priceLabel, zoom = 14 }: MapViewProps) {
  return (
    <div className="space-y-1">
      <div className="h-[300px] w-full rounded-[var(--radius)] overflow-hidden border border-[var(--border)] relative z-10">
        <ProjectMapInner lat={lat} lng={lng} projectName={projectName} priceLabel={priceLabel} zoom={zoom} />
      </div>
      <p className="text-[10px] text-[var(--text-muted)] text-right">
        Map data © OpenStreetMap contributors
      </p>
    </div>
  );
}
