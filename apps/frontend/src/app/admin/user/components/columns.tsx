'use client';

import { ColumnDef } from '@tanstack/react-table';
import { User } from '@/app/admin/user/user.type';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit2Icon, KeyRoundIcon, Trash2Icon } from 'lucide-react';

export interface UserColumnsMeta {
  onEditUser?: (user: User) => void;
  onDeleteUser?: (user: User) => void;
  onResetPassword?: (user: User) => void;
  isAdmin?: boolean;
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'displayName',
    header: 'Full Name',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={user.image_url} alt={user.displayName} />
            <AvatarFallback>{user.displayName?.slice(0, 2).toUpperCase() || 'US'}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-slate-900">{user.displayName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = (row.getValue('role') as string) || 'USER';
      return (
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
          {role}
        </span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => {
      const rawDate = row.getValue('createdAt');
      if (!rawDate) return '-';
      const date = new Date(rawDate as string | Date);
      return <span>{date.toLocaleDateString('en-US')}</span>;
    },
  },
  {
    id: 'actions',
    header: () => <div className="justify-self-end mr-5"> Actions</div>,
    cell: ({ row, table }) => {
      const user = row.original;
      const meta = table.options.meta as UserColumnsMeta | undefined;

      return (
        <div className="flex items-center justify-end gap-2" data-no-row-open="true">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              meta?.onEditUser?.(user);
            }}
            className="size-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Edit"
          >
            <Edit2Icon className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              meta?.onResetPassword?.(user);
            }}
            className="size-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            title="Reset Password"
          >
            <KeyRoundIcon className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              meta?.onDeleteUser?.(user);
            }}
            className="size-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      );
    },
  },
];
