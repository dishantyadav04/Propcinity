"use client";

import { useEffect, useRef, useState } from "react";
import ProjectImage from "./ProjectImage";
import { motion, PanInfo } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GallerySliderProps {
  images: string[];
}

const SLIDE_TRANSITION = {
  type: "tween" as const,
  duration: 0.22,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

const SWIPE_DISTANCE = 40;
const SWIPE_VELOCITY = 300;

export default function GallerySlider({
  images,
}: GallerySliderProps) {
  const [index, setIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  const isDragging = useRef(false);
  const galleryAnimating = useRef(false);

  /*
   * Keep the index valid if the images prop changes.
   */
  useEffect(() => {
    if (images.length === 0) {
      setIndex(0);
      return;
    }

    setIndex((current) =>
      Math.min(current, images.length - 1)
    );
  }, [images.length]);

  /*
   * Preload gallery images.
   */
  useEffect(() => {
    if (!images.length) return;

    images.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [images]);

  /*
   * Lock background scrolling while fullscreen preview is open.
   *
   * requestAnimationFrame prevents the body layout change from
   * happening in the exact same frame as the fullscreen layer mount.
   */
  useEffect(() => {
    if (!previewOpen) return;

    const originalOverflow = document.body.style.overflow;

    const frame = window.requestAnimationFrame(() => {
      document.body.style.overflow = "hidden";
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = originalOverflow;
    };
  }, [previewOpen]);

  /*
   * Close fullscreen preview with Escape.
   */
  useEffect(() => {
    if (!previewOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewOpen(false);
      }

      if (event.key === "ArrowRight" && images.length > 1) {
        goToNext();
      }

      if (event.key === "ArrowLeft" && images.length > 1) {
        goToPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewOpen, images.length]);

  /*
   * Main gallery navigation.
   *
   * Uses functional state updates so rapid interactions don't
   * accidentally use a stale index.
   */
  const goToNext = () => {
    if (images.length <= 1) return;

    if (galleryAnimating.current) return;

    galleryAnimating.current = true;

    setIndex((current) => (current + 1) % images.length);

    window.setTimeout(() => {
      galleryAnimating.current = false;
    }, SLIDE_TRANSITION.duration * 1000);
  };

  const goToPrevious = () => {
    if (images.length <= 1) return;

    if (galleryAnimating.current) return;

    galleryAnimating.current = true;

    setIndex(
      (current) =>
        (current - 1 + images.length) % images.length
    );

    window.setTimeout(() => {
      galleryAnimating.current = false;
    }, SLIDE_TRANSITION.duration * 1000);
  };

  /*
   * Direct navigation.
   */
  const goTo = (targetIndex: number) => {
    if (images.length <= 1) return;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    if (targetIndex === index) return;

    if (galleryAnimating.current) return;

    galleryAnimating.current = true;
    setIndex(targetIndex);

    window.setTimeout(() => {
      galleryAnimating.current = false;
    }, SLIDE_TRANSITION.duration * 1000);
  };

  /*
   * Mobile swipe handling.
   */
  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (
      info.offset.x < -SWIPE_DISTANCE ||
      info.velocity.x < -SWIPE_VELOCITY
    ) {
      goToNext();
    } else if (
      info.offset.x > SWIPE_DISTANCE ||
      info.velocity.x > SWIPE_VELOCITY
    ) {
      goToPrevious();
    }

    window.setTimeout(() => {
      isDragging.current = false;
    }, 50);
  };

  /*
   * Don't render anything if there are no images.
   */
  if (!images.length) {
    return null;
  }

  return (
    <div className="pb-6 sm:pb-8">
      {/* =========================================================
          MAIN GALLERY
      ========================================================== */}
      <div
        className={cn(
          "relative aspect-[4/3] w-full max-w-2xl mx-auto",
          "overflow-hidden rounded-[var(--radius)] bg-black",
          "group"
        )}
        style={{
          touchAction: "pan-y",
          overscrollBehaviorX: "contain",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* IMAGE TRACK */}
        <motion.div
          className="flex h-full w-full select-none"
          style={{
            willChange: "transform",
            transform: "translateZ(0)",
            WebkitTransform: "translateZ(0)",
          }}
          animate={{
            x: `-${index * 100}%`,
          }}
          transition={SLIDE_TRANSITION}
          drag={images.length > 1 ? "x" : false}
          dragMomentum={false}
          dragSnapToOrigin
          dragElastic={0.12}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative h-full w-full flex-shrink-0"
              style={{
                contain: "layout style paint",
              }}
            >
              <ProjectImage
                src={src}
                alt={`Property image ${i + 1}`}
                priority={Math.abs(i - index) <= 1}
                sizes="(max-width: 768px) 100vw, 70vw"
              />
            </div>
          ))}
        </motion.div>

        {/* BOTTOM GRADIENT */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* =======================================================
            DOT INDICATORS
        ======================================================== */}
        {images.length > 1 && (
          <div
            className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 px-4 pointer-events-none"
            aria-hidden="true"
          >
            {images.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  index === i
                    ? "bg-white w-6"
                    : "bg-white/40 w-1.5"
                )}
              />
            ))}
          </div>
        )}

        {/* =======================================================
            PREVIOUS / NEXT
        ======================================================== */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2",
                "p-2 rounded-full",
                "bg-black/55 text-white",
                "z-10",
                "opacity-100 lg:opacity-0",
                "lg:group-hover:opacity-100",
                "transition-opacity duration-200",
                "hover:bg-black/75",
                "active:scale-95",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              )}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={goToNext}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2",
                "p-2 rounded-full",
                "bg-black/55 text-white",
                "z-10",
                "opacity-100 lg:opacity-0",
                "lg:group-hover:opacity-100",
                "transition-opacity duration-200",
                "hover:bg-black/75",
                "active:scale-95",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              )}
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* =======================================================
            TOP CONTROLS
        ======================================================== */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className={cn(
              "bg-black/65 p-1.5 rounded-lg text-white",
              "hover:bg-black/80",
              "active:scale-95",
              "transition-all duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            )}
            aria-label="Open full preview"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <div
            className={cn(
              "bg-black/65 px-2.5 py-1 rounded-lg",
              "text-[10px] font-bold text-white",
              "uppercase tracking-wider"
            )}
            aria-label={`Image ${index + 1} of ${images.length}`}
          >
            {index + 1} / {images.length}
          </div>
        </div>
      </div>

      {/* =========================================================
          FULLSCREEN PREVIEW

          Intentionally NOT animated.

          Mobile browsers can flicker when a fixed fullscreen
          element is simultaneously fading while body overflow
          changes. Instant mounting/unmounting is much more stable.
      ========================================================== */}
      {previewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Property image preview"
          className={cn(
            "fixed inset-0 z-[200]",
            "bg-black/95",
            "flex items-center justify-center"
          )}
          style={{
            transform: "translateZ(0)",
            WebkitTransform: "translateZ(0)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            willChange: "transform",
            overscrollBehavior: "contain",
            touchAction: "none",
          }}
          onClick={() => setPreviewOpen(false)}
        >
          {/* =====================================================
              CLOSE BUTTON
          ====================================================== */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setPreviewOpen(false);
            }}
            className={cn(
              "absolute top-4 right-4",
              "p-2.5 rounded-full",
              "bg-white/10 text-white",
              "hover:bg-white/20",
              "active:scale-95",
              "transition-all duration-150",
              "z-20",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            )}
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>

          {/* =====================================================
              IMAGE COUNTER
          ====================================================== */}
          <div
            className={cn(
              "absolute top-4 left-4",
              "bg-black/65 px-3 py-1.5 rounded-lg",
              "text-xs font-bold text-white",
              "uppercase tracking-wider",
              "z-20"
            )}
          >
            {index + 1} / {images.length}
          </div>

          {/* =====================================================
              FULLSCREEN IMAGE
          ====================================================== */}
          <div
            className={cn(
              "relative",
              "w-full h-full",
              "max-w-5xl max-h-[90vh]",
              "m-auto px-4",
              "flex items-center justify-center",
              "z-10"
            )}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div
              className="relative w-full h-full"
              style={{
                transform: "translateZ(0)",
                WebkitTransform: "translateZ(0)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <ProjectImage
                src={images[index]}
                alt={`Property image ${index + 1} full preview`}
                priority
                sizes="100vw"
                fit="contain"
              />
            </div>
          </div>

          {/* =====================================================
              FULLSCREEN PREVIOUS / NEXT
          ====================================================== */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goToPrevious();
                }}
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2",
                  "p-2.5 rounded-full",
                  "bg-white/10 text-white",
                  "hover:bg-white/20",
                  "active:scale-95",
                  "transition-all duration-150",
                  "z-20",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goToNext();
                }}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2",
                  "p-2.5 rounded-full",
                  "bg-white/10 text-white",
                  "hover:bg-white/20",
                  "active:scale-95",
                  "transition-all duration-150",
                  "z-20",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                )}
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}