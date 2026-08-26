'use client';

import { useEffect, useRef, useState } from "react";
import ProjectImage from "./ProjectImage";
import { motion, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GallerySliderProps {
  images: string[];
}

const SLIDE_TRANSITION = { type: "tween" as const, duration: 0.28, ease: "easeInOut" as const };
const MODAL_TRANSITION = { duration: 0.2, ease: "easeOut" as const };
const SWIPE_DISTANCE = 45;
const SWIPE_VELOCITY = 400;

export default function GallerySlider({ images }: GallerySliderProps) {
  const [index, setIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const isDragging = useRef(false);
  const isAnimating = useRef(false);

  const goTo = (next: number) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setIndex((next + images.length) % images.length);
    window.setTimeout(() => {
      isAnimating.current = false;
    }, SLIDE_TRANSITION.duration * 1000);
  };
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) next();
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) prev();
    setTimeout(() => { isDragging.current = false; }, 50);
  };
  const handleDragStart = () => { isDragging.current = true; };

  // Lock background scroll while the lightbox is open (prevents iOS jump/repaint)
  useEffect(() => {
    if (!isPreviewOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [isPreviewOpen]);

  // Shared translating track — same element persists across index changes,
  // never unmounts, so Framer can animate `x` continuously (no remount snap).
  const Track = ({ fit, sizes, priority }: { fit: 'cover' | 'contain'; sizes: string; priority: boolean }) => (
    <motion.div
      className="flex h-full w-full"
      style={{ willChange: 'transform' }}
      animate={{ x: `-${index * 100}%` }}
      transition={SLIDE_TRANSITION}
      drag={images.length > 1 ? "x" : false}
      dragMomentum={false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {images.map((src, i) => (
        <div key={src} className="relative h-full w-full flex-shrink-0">
          <ProjectImage
            src={src}
            alt={`Gallery image ${i + 1}`}
            // Eager-load the current slide plus both neighbors so swiping
            // never triggers a first-time fetch/decode mid-gesture.
            priority={priority && Math.abs(i - index) <= 1}
            sizes={sizes}
            fit={fit}
          />
        </div>
      ))}
    </motion.div>
  );

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] bg-black group">
      <button
        type="button"
        onClick={() => { if (!isDragging.current) setIsPreviewOpen(true); }}
        className="absolute inset-0 w-full h-full z-0"
        aria-label="Open full preview"
      >
        <Track fit="cover" sizes="(max-width: 768px) 100vw, 70vw" priority />
      </button>

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 px-4">
        {images.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              index === i ? "bg-white w-6" : "bg-white/40 w-1.5"
            )}
          />
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/55 rounded-full text-white
              opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/55 rounded-full text-white
              opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => setIsPreviewOpen(true)}
          className="bg-black/65 p-1.5 rounded-lg text-white hover:bg-black/80 transition-colors"
          aria-label="Expand image"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <div className="bg-black/65 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
          {index + 1} / {images.length}
        </div>
      </div>

      {isPreviewOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={MODAL_TRANSITION}
          style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={() => { if (!isDragging.current) setIsPreviewOpen(false); }}
        >
          <button
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white z-10"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute top-4 left-4 bg-black/65 px-3 py-1.5 rounded-lg text-xs font-bold text-white uppercase tracking-wider">
            {index + 1} / {images.length}
          </div>

          <div
            className="w-full h-full max-w-4xl max-h-[85vh] m-auto px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Track fit="contain" sizes="100vw" priority />
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
