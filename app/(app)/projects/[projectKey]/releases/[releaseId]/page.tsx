import { ReleaseDetailView } from '@/components/releases/release-detail-view';

export default async function ReleasePage({
  params,
}: PageProps<'/projects/[projectKey]/releases/[releaseId]'>) {
  const { projectKey, releaseId } = await params;
  return <ReleaseDetailView projectKey={projectKey} releaseId={releaseId} />;
}
