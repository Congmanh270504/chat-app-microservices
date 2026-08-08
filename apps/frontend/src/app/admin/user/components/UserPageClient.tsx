/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import * as React from 'react';
import { User } from '@/app/admin/user/user.type';
import { DataTable } from '@/components/table/DataTable';
import { columns, UserColumnsMeta } from './columns';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { UserDialog } from './UserDialog';
import { deleteUserAction } from '@/app/admin/user/user.actions';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';

interface UserPageClientProps {
  initialUsers: User[];
}

export function UserPageClient({ initialUsers }: UserPageClientProps) {
  const [users, setUsers] = React.useState<User[]>(initialUsers);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  // Dialog States
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [userToEdit, setUserToEdit] = React.useState<User | null>(null);

  // Delete Dialog States
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

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

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteUserAction(userToDelete.id);
      if (res.success) {
        toast.success(`Đã xóa người dùng "${userToDelete.displayName}"`);
        setIsDeleteOpen(false);
        setUserToDelete(null);
      } else {
        toast.error(res.error || 'Xóa người dùng thất bại');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi xóa');
    } finally {
      setIsDeleting(false);
    }
  };

  const metaConfig: UserColumnsMeta = {
    onEditUser: handleEdit,
    onDeleteUser: handleDeleteTrigger,
  };

  return (
    <div className="flex-1 w-full h-full space-y-4 p-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Danh sách Người dùng</h1>
          <p className="text-sm text-slate-500">Quản lý tài khoản và quyền hạn trong hệ thống</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <PlusIcon className="size-4" />
          Thêm người dùng
        </Button>
      </div>

      <div className="rounded-lg border bg-white shadow-xs">
        <DataTable
          columns={columns}
          data={users}
          meta={metaConfig}
          enableSearch={true}
          searchPlaceholder="Tìm kiếm theo tên, email..."
          clientPagination={true}
          initialPageSize={10}
          emptyMessage="Không có người dùng nào."
        />
      </div>

      {/* Dialog Thêm/Sửa User */}
      <UserDialog open={isFormOpen} onOpenChange={setIsFormOpen} user={userToEdit} />

      {/* Dialog Xác nhận Xóa User */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Xác nhận xóa người dùng"
        description={`Bạn có chắc chắn muốn xóa người dùng "${userToDelete?.displayName}"? Hành động này không thể hoàn tác.`}
        actionText="Xóa tài khoản"
        cancelText="Hủy"
      />
    </div>
  );
}
