import { userService } from '@/app/admin/user/user.service';
import { UserPageClient } from './components/UserPageClient';

export const dynamic = 'force-dynamic';

export default async function UserPage() {
  const users = await userService.getAll();

  return <UserPageClient initialUsers={users} />;
}
