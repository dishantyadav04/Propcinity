import ProjectForm from "@/components/admin/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Add New Project</h1>
        <p className="text-sm text-[var(--text-muted)]">Audit a new project and publish it to the dashboard</p>
      </div>
      <ProjectForm />
    </div>
  );
}
