import { PhaseBoardView } from '@/components/projects/phase-board-view';

export default async function PhasesPage({ params }: PageProps<'/projects/[projectKey]/phases'>) {
  const { projectKey } = await params;
  return <PhaseBoardView projectKey={projectKey} />;
}
