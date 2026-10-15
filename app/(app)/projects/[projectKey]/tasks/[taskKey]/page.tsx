import { TaskDetailView } from '@/components/tasks/task-detail-view';

export default async function TaskPage({ params }: PageProps<'/projects/[projectKey]/tasks/[taskKey]'>) {
  const { projectKey, taskKey } = await params;
  return <TaskDetailView projectKey={projectKey} taskKey={taskKey} />;
}
