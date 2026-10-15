import { HotfixListView } from '@/components/releases/hotfix-list-view';

export default async function HotfixesPage({
  params,
}: PageProps<'/projects/[projectKey]/hotfixes'>) {
  const { projectKey } = await params;
  return <HotfixListView projectKey={projectKey} />;
}
