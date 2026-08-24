'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface ProjectImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  fit?: 'cover' | 'contain';
}

export default function ProjectImage({ src, alt, priority = false, sizes, fit = 'cover' }: ProjectImageProps) {
  const [hasError, setHasError] = useState(false);

  if (process.env.NODE_ENV === 'development' && src && /^https?:\/\/images\.unsplash\.com/.test(src)) {
    console.warn('[ProjectImage] Unsplash URL detected — replace with R2 asset');
  }

  if (!src || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Building2 className="w-8 h-8 text-[var(--text-muted)]" />
      </div>
    );
  }

  if (src.endsWith('.svg') || src.includes('.svg?')) {
    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading={priority ? 'eager' : 'lazy'}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={fit === 'contain' ? 'object-contain' : 'object-cover'}
      onError={() => setHasError(true)}
      priority={priority}
      loading={priority ? 'eager' : undefined}
      sizes={sizes}
    />
  );
}
