import BlogFormWrapper from "@/components/admin/BlogFormWrapper";

export default function NewBlogPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>New Blog Post</h1>
        <p className="text-sm text-[var(--text-muted)]">Write and publish a new blog post</p>
      </div>
      <BlogFormWrapper />
    </div>
  );
}
