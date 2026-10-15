import { ProjectReportView } from '@/components/projects/project-report-view';

export default async function ReportsPage({
  params,
}: PageProps<'/projects/[projectKey]/reports'>) {
  const { projectKey } = await params;
  return <ProjectReportView projectKey={projectKey} />;
}
