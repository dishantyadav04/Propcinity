'use client';

import dynamic from 'next/dynamic';

const BlogForm = dynamic(() => import("@/components/admin/BlogForm"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)] animate-pulse" />
  ),
});

export default function BlogFormWrapper({ blogId }: { blogId?: string }) {
  return <BlogForm blogId={blogId} />;
}
