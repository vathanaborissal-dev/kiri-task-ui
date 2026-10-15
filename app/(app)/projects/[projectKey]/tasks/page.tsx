import { TaskListView } from '@/components/tasks/task-list-view';

export default async function ProjectTasksPage({
  params,
}: PageProps<'/projects/[projectKey]/tasks'>) {
  const { projectKey } = await params;
  return <TaskListView projectKey={projectKey} />;
}
