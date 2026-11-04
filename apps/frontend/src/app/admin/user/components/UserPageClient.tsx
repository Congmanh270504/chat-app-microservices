/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import * as React from 'react';
import { User } from '@/app/admin/user/user.type';
import { DataTable } from '@/components/table/DataTable';
import { columns, UserColumnsMeta } from './columns';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { UserDialog } from './UserDialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { deleteUserAction } from '@/app/admin/user/user.actions';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface UserPageClientProps {
  initialUsers: User[];
}

export function UserPageClient({ initialUsers }: UserPageClientProps) {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const [users, setUsers] = React.useState<User[]>(initialUsers);

  // Dialog States
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [userToEdit, setUserToEdit] = React.useState<User | null>(null);

  // Delete Dialog States
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Reset Password Dialog States
  const [isResetOpen, setIsResetOpen] = React.useState(false);
  const [userToReset, setUserToReset] = React.useState<User | null>(null);

  React.useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // Handlers
  const handleCreateNew = () => {
    setUserToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setUserToEdit(user);
    setIsFormOpen(true);
  };

  const handleDeleteTrigger = (user: User) => {
    setUserToDelete(user);
    setIsDeleteOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setUserToReset(user);
    setIsResetOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteUserAction(userToDelete.id);
      if (res.success) {
        toast.success(`User "${userToDelete.displayName}" deleted successfully`);
        setIsDeleteOpen(false);
        setUserToDelete(null);
      } else {
        toast.error(res.error || 'Failed to delete user');
      }
    } catch (err: any) {
      toast.error(err?.message || 'An error occurred while deleting');
    } finally {
      setIsDeleting(false);
    }
  };

  const metaConfig: UserColumnsMeta = {
    onEditUser: handleEdit,
    onDeleteUser: handleDeleteTrigger,
    onResetPassword: handleResetPassword,
    isAdmin,
  };

  return (
    <div className="flex-1 w-full h-full space-y-4 p-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">Manage user accounts and roles in the system</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <PlusIcon className="size-4" />
          Add User
        </Button>
      </div>

      <div className="rounded-lg border bg-white shadow-xs">
        <DataTable
          columns={columns}
          data={users}
          meta={metaConfig}
          enableSearch={true}
          searchPlaceholder="Search by name, email..."
          clientPagination={true}
          initialPageSize={10}
          emptyMessage="No users found."
        />
      </div>

      {/* Add/Edit User Dialog */}
      <UserDialog open={isFormOpen} onOpenChange={setIsFormOpen} user={userToEdit} />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={isResetOpen}
        onOpenChange={setIsResetOpen}
        user={userToReset}
      />

      {/* Delete User Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Delete User"
        description={`Are you sure you want to delete user "${userToDelete?.displayName}"? This action cannot be undone.`}
        actionText="Delete Account"
        cancelText="Cancel"
      />
    </div>
  );
}
