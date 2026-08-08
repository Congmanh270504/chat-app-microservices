'use server';

import { userService } from '@/app/admin/user/user.service';
import { CreateUserInput } from '@/app/admin/user/user.type';
import { revalidatePath } from 'next/cache';

export async function createUserAction(data: CreateUserInput) {
  try {
    const newUser = await userService.create(data);
    revalidatePath('/user');
    revalidatePath('/admin/user');
    return { success: true, data: newUser };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Có lỗi xảy ra khi tạo người dùng' };
  }
}

export async function updateUserAction(id: string, data: Partial<CreateUserInput>) {
  try {
    const updatedUser = await userService.update(id, data);
    revalidatePath('/user');
    revalidatePath('/admin/user');
    return { success: true, data: updatedUser };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Có lỗi xảy ra khi cập nhật người dùng' };
  }
}

export async function deleteUserAction(id: string) {
  try {
    console.log('Deleting user server action:', id);
    await userService.delete(id);
    revalidatePath('/user');
    revalidatePath('/admin/user');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Có lỗi xảy ra khi xóa người dùng' };
  }
}
