import BlogFormWrapper from "@/components/admin/BlogFormWrapper";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Edit Blog Post</h1>
        <p className="text-sm text-[var(--text-muted)]">Update your blog post content and settings</p>
      </div>
      <BlogFormWrapper blogId={id} />
    </div>
  );
}
