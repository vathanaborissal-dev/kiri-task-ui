import { IssueDetailView } from '@/components/issues/issue-detail-view';

export default async function IssuePage({
  params,
}: PageProps<'/projects/[projectKey]/issues/[issueKey]'>) {
  const { projectKey, issueKey } = await params;
  return <IssueDetailView projectKey={projectKey} issueKey={issueKey} />;
}
