'use client';

import { CenteredSpinner } from '@/components/common/loading';
import { IssueListView } from '@/components/issues/issue-list-view';
import { useProject, useProjectMembers } from '@/lib/hooks/use-projects';

export function ProjectIssuesView({ projectKey }: { projectKey: string }) {
  const { data: project } = useProject(projectKey);
  const { data: members } = useProjectMembers(projectKey);

  if (!project) return <CenteredSpinner />;

  const permissions = new Set(project.myPermissions);
  const canCreate = permissions.has('*') || permissions.has('issue:create');

  return (
    <IssueListView
      project={project}
      members={members ?? []}
      canCreate={canCreate}
      title={`${project.name} issues`}
    />
  );
}
