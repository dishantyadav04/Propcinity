import React from 'react';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
  style?: React.CSSProperties;
}

export default function FadeIn({ children, delay = 0, className = '', style = {}, as: Component = 'div' }: FadeInProps) {
  return (
    <Component
      className={`animate-fade-in-up ${className}`}
      style={{ ...style, animationDelay: `${delay}s`, opacity: 0 }}
    >
      {children}
    </Component>
  );
}
