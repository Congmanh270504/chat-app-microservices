'use server';

import { userService } from '@/app/admin/user/user.service';
import { revalidatePath } from 'next/cache';

const GATEWAY_URL = process.env.GATE_WAY_URL || 'http://127.0.0.1:4000';

export async function updateUserProfileAction(
  userId: string,
  data: { displayName: string; image_url?: string },
) {
  try {
    if (!userId) {
      return { success: false, error: 'Không tìm thấy thông tin người dùng' };
    }

    const updatedUser = await userService.update(userId, {
      displayName: data.displayName,
      image_url: data.image_url,
    });

    revalidatePath('/chat');
    revalidatePath('/');

    return { success: true, data: updatedUser };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Có lỗi xảy ra khi cập nhật thông tin cá nhân',
    };
  }
}

export async function changeUserPasswordAction(data: {
  userId: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  try {
    if (!data.userId) {
      return { success: false, error: 'Không tìm thấy ID người dùng' };
    }

    const res = await fetch(`${GATEWAY_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: resData.message || 'Mật khẩu hiện tại không chính xác hoặc có lỗi xảy ra',
      };
    }

    return {
      success: true,
      message: resData.message || 'Đổi mật khẩu thành công',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Có lỗi xảy ra khi cập nhật mật khẩu',
    };
  }
}
