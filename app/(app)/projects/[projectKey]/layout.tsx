import { ProjectShell } from '@/components/projects/project-shell';

export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<'/projects/[projectKey]'>) {
  const { projectKey } = await params;
  return <ProjectShell projectKey={projectKey}>{children}</ProjectShell>;
}
