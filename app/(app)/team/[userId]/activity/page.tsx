import { MemberActivityView } from '@/components/team/member-activity-view';

export const metadata = { title: 'Activity' };

export default async function MemberActivityPage({
  params,
}: PageProps<'/team/[userId]/activity'>) {
  const { userId } = await params;
  return <MemberActivityView userId={userId} />;
}
