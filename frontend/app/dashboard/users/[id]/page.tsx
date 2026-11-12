
import { UserDetails } from "@/features/users/user-details";

interface UserDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserDetailsPage({
  params,
}: UserDetailsPageProps) {
  const { id } = await params;

  return <UserDetails userId={id} />;
}
