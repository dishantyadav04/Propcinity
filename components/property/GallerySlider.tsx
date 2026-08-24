'use client';

import { useState, useRef } from "react";
import ProjectImage from "./ProjectImage";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GallerySliderProps {
  images: string[];
}

// Position-only slide variants — no opacity animation, so slides never blend/ghost.
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%" }),
  center: { x: 0 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%" }),
};

const SLIDE_TRANSITION = { type: "tween" as const, duration: 0.28, ease: "easeInOut" as const };

export default function GallerySlider({ images }: GallerySliderProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const isDragging = useRef(false);

  const prevIndex = (index - 1 + images.length) % images.length;
  const nextIndex = (index + 1) % images.length;

  const next = () => {
    setDirection(1);
    setIndex((p) => (p + 1) % images.length);
  };
  const prev = () => {
    setDirection(-1);
    setIndex((p) => (p - 1 + images.length) % images.length);
  };

  // Swipe threshold: distance in px OR flick velocity, whichever comes first
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const SWIPE_DISTANCE = 45;
    const SWIPE_VELOCITY = 400;

    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) {
      next();
    } else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) {
      prev();
    }
    setTimeout(() => {
      isDragging.current = false;
    }, 50);
  };

  const handleDragStart = () => {
    isDragging.current = true;
  };

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] group">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={index}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SLIDE_TRANSITION}
          drag={images.length > 1 ? "x" : false}
          dragMomentum={false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 touch-pan-y cursor-grab active:cursor-grabbing"
        >
          <button
            type="button"
            onClick={() => {
              if (isDragging.current) return;
              setIsPreviewOpen(true);
            }}
            className="absolute inset-0 w-full h-full"
            aria-label="Open full preview"
          >
            <ProjectImage
              src={images[index]}
              alt={`Gallery image ${index + 1}`}
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 70vw"
            />
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Preload neighbors so swiping doesn't reveal an unloaded image mid-slide */}
      {images.length > 1 && (
        <div className="hidden">
          <ProjectImage src={images[prevIndex]} alt="" sizes="1px" />
          <ProjectImage src={images[nextIndex]} alt="" sizes="1px" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Navigation dots */}
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

      {/* Full-screen preview lightbox */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
            onClick={() => {
              if (isDragging.current) return;
              setIsPreviewOpen(false);
            }}
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

            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={index}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={SLIDE_TRANSITION}
                className="absolute inset-0 max-w-4xl max-h-[85vh] m-auto flex items-center justify-center px-4 touch-pan-y"
                onClick={(e) => e.stopPropagation()}
                drag={images.length > 1 ? "x" : false}
                dragMomentum={false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <img
                  src={images[index]}
                  alt={`Gallery image ${index + 1} full preview`}
                  className="max-w-full max-h-full object-contain rounded-[var(--radius)] pointer-events-none select-none"
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>

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
      </AnimatePresence>
    </div>
  );
}
