import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  wide?: boolean;
}

export default function SectionContainer({
  children, className, noPadding = false, wide = false
}: SectionContainerProps) {
  return (
    <div className={cn(
      "w-full mx-auto",
      wide ? "max-w-6xl" : "max-w-3xl",
      !noPadding && "px-4 sm:px-6 py-4 sm:py-6",
      className
    )}>
      {children}
    </div>
  );
}
