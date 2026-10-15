import { HotfixDetailView } from '@/components/releases/hotfix-detail-view';

export default async function HotfixPage({
  params,
}: PageProps<'/projects/[projectKey]/hotfixes/[hotfixKey]'>) {
  const { projectKey, hotfixKey } = await params;
  return <HotfixDetailView projectKey={projectKey} hotfixKey={hotfixKey} />;
}
