import { ProjectOverview } from '@/components/projects/project-overview';

export default async function ProjectPage({ params }: PageProps<'/projects/[projectKey]'>) {
  const { projectKey } = await params;
  return <ProjectOverview projectKey={projectKey} />;
}
