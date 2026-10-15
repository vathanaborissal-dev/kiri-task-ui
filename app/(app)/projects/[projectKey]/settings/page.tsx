import { ProjectSettingsView } from '@/components/projects/project-settings-view';

export default async function ProjectSettingsPage({
  params,
}: PageProps<'/projects/[projectKey]/settings'>) {
  const { projectKey } = await params;
  return <ProjectSettingsView projectKey={projectKey} />;
}
