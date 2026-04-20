import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function SectionContainer({ children, className, noPadding = false }: SectionContainerProps) {
  return (
    <section className={cn(
      "w-full max-w-md mx-auto",
      !noPadding && "px-6 py-8",
      className
    )}>
      {children}
    </section>
  );
}
