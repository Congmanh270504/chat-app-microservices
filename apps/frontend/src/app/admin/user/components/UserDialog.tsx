/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import * as React from 'react';
import { User, CreateUserInput, Role } from '@/app/admin/user/user.type';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createUserAction, updateUserAction } from '@/app/admin/user/user.actions';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const isEditing = !!user;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState<CreateUserInput>({
    email: '',
    displayName: '',
    role: Role.USER,
    image_url: '',
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        displayName: user.displayName || '',
        role: (user.role as Role) || Role.USER,
        image_url: user.image_url || '',
      });
    } else {
      setFormData({
        email: '',
        displayName: '',
        role: Role.USER,
        image_url: '',
      });
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing && user) {
        const res = await updateUserAction(user.id, formData);
        if (res.success) {
          toast.success('Cập nhật người dùng thành công');
          onOpenChange(false);
        } else {
          toast.error(res.error || 'Cập nhật thất bại');
        }
      } else {
        const res = await createUserAction(formData);
        if (res.success) {
          toast.success('Tạo người dùng mới thành công');
          onOpenChange(false);
        } else {
          toast.error(res.error || 'Tạo người dùng thất bại');
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2 flex flex-col items-center">
            <Label htmlFor="image_url" className="self-start">
              Ảnh đại diện
            </Label>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              folder="chat-app-microservices/users"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Họ và tên</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="Nguyễn Văn A"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Vai trò</Label>
            <Select
              id="role"
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value as Role })}
            >
              <SelectTrigger>
                <SelectValue placeholder="USER / ADMIN" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">USER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="MODERATOR">MODERATOR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
