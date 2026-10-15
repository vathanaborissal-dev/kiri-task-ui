import { ProjectIssuesView } from '@/components/issues/project-issues-view';

export default async function ProjectIssuesPage({
  params,
}: PageProps<'/projects/[projectKey]/issues'>) {
  const { projectKey } = await params;
  return <ProjectIssuesView projectKey={projectKey} />;
}
