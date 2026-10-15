'use client';

import { PageHeader } from '@/components/common/page-header';
import { IssueListView } from '@/components/issues/issue-list-view';
import { useAuth } from '@/providers/auth-provider';

export function AllIssuesView() {
  const { canAnywhere } = useAuth();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Issues"
        description="Everything reported across the projects you can access."
      />
      <IssueListView canCreate={canAnywhere('issue:create')} showProject />
    </div>
  );
}
