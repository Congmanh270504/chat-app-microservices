'use server';

import { userService } from '@/app/admin/user/user.service';
import { CreateUserInput } from '@/app/admin/user/user.type';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createUserAction(
  data: CreateUserInput & { password?: string },
) {
  try {
    const newUser = await userService.create({
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      image_url: data.image_url,
    });

    // Automatically set up credentials in auth-service so the user can log in immediately
    const initialPassword = data.password?.trim() || 'Password123!';
    try {
      await userService.resetPassword(
        newUser.id,
        initialPassword,
        newUser.email,
        newUser.displayName,
      );
    } catch (authErr) {
      console.error('Failed to create credentials for new user in auth-service:', authErr);
    }

    revalidatePath('/user');
    revalidatePath('/admin/user');
    return { success: true, data: newUser };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create user' };
  }
}

export async function updateUserAction(id: string, data: Partial<CreateUserInput>) {
  try {
    const updatedUser = await userService.update(id, data);
    revalidatePath('/user');
    revalidatePath('/admin/user');
    return { success: true, data: updatedUser };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update user' };
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
    return { success: false, error: error?.message || 'Failed to delete user' };
  }
}

export async function resetPasswordAction(
  userId: string,
  newPassword: string,
  email?: string,
  displayName?: string,
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized: Please log in' };
    }

    let role = ((session.user as any)?.role || '').toUpperCase();

    // Check by email or query user-service if role not yet set in session
    if (session.user.email === 'admin@gmail.com') {
      role = 'ADMIN';
    } else if (role !== 'ADMIN' && session.user.id) {
      try {
        const currentUser = await userService.getById(session.user.id);
        if (currentUser?.role) {
          role = currentUser.role.toUpperCase();
        }
      } catch (err) {
        console.error('Failed to verify user role in resetPasswordAction:', err);
      }
    }

    if (role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Admin privileges required' };
    }

    const res = await userService.resetPassword(userId, newPassword, email, displayName);
    return { success: true, message: res.message || 'Password reset successfully' };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to reset password' };
  }
}
