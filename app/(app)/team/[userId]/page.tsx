import { TeamMemberView } from '@/components/team/team-member-view';

export default async function TeamMemberPage({ params }: PageProps<'/team/[userId]'>) {
  const { userId } = await params;
  return <TeamMemberView userId={userId} />;
}
