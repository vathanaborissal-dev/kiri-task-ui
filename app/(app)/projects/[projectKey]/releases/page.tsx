import { ReleaseListView } from '@/components/releases/release-list-view';

export default async function ReleasesPage({
  params,
}: PageProps<'/projects/[projectKey]/releases'>) {
  const { projectKey } = await params;
  return <ReleaseListView projectKey={projectKey} />;
}
