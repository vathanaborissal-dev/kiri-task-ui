import { ProjectBoardView } from '@/components/projects/project-board-view';

export default async function BoardPage({ params }: PageProps<'/projects/[projectKey]/board'>) {
  const { projectKey } = await params;
  return <ProjectBoardView projectKey={projectKey} />;
}
