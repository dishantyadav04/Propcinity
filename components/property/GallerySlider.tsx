'use client';

import { useRef, useState } from "react";
import ProjectImage from "./ProjectImage";
import { motion, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GallerySliderProps {
  images: string[];
}

const SLIDE_TRANSITION = { type: "tween" as const, duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const };
const SWIPE_DISTANCE = 40;
const SWIPE_VELOCITY = 300;

export default function GallerySlider({ images }: GallerySliderProps) {
  const [index, setIndex] = useState(0);
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

  return (
    <div
      className="relative aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-[var(--radius)] bg-black group"
      style={{ touchAction: 'pan-y', overscrollBehaviorX: 'contain' }}
    >
      <motion.div
        className="flex h-full w-full select-none"
        style={{ willChange: 'transform' }}
        animate={{ x: `-${index * 100}%` }}
        transition={SLIDE_TRANSITION}
        drag={images.length > 1 ? "x" : false}
        dragMomentum={false}
        dragSnapToOrigin
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {images.map((src, i) => (
          <div
            key={src}
            className="relative h-full w-full flex-shrink-0"
            style={{ contain: 'layout style' }}
          >
            <ProjectImage
              src={src}
              alt={`Gallery image ${i + 1}`}
              priority={Math.abs(i - index) <= 1}
              sizes="(max-width: 768px) 100vw, 70vw"
            />
          </div>
        ))}
      </motion.div>

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

      <div className="absolute top-4 right-4 z-10">
        <div className="bg-black/65 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
          {index + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
