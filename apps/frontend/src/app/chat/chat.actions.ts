'use server';

import { auth } from '@/lib/auth';
import { userService } from '@/app/admin/user/user.service';

const GATEWAY_URL = process.env.GATE_WAY_URL || 'http://127.0.0.1:4000';

export async function getUsersAction() {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const users = await userService.getAll();
    const filtered = users.filter((u) => u.id !== currentUserId);
    return { success: true, data: filtered };
  } catch (error: any) {
    console.error('getUsersAction error:', error);
    return { success: false, error: error?.message || 'Không thể lấy danh sách người dùng' };
  }
}

export async function createConversationAction(targetUserId: string) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    const currentUserId = session?.user?.id;

    if (!token || !currentUserId) {
      return { success: false, error: 'Phiên làm việc hết hạn hoặc chưa đăng nhập' };
    }

    const res = await fetch(`${GATEWAY_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        participantIds: [currentUserId, targetUserId],
      }),
    });

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: resData.message || 'Không thể tạo cuộc trò chuyện',
      };
    }

    return { success: true, data: resData.data };
  } catch (error: any) {
    console.error('createConversationAction error:', error);
    return { success: false, error: error?.message || 'Lỗi khi tạo cuộc trò chuyện' };
  }
}


export async function getConversationAction(conversationId: string) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    const currentUserId = session?.user?.id;

    if (!token || !currentUserId) {
      return { success: false, error: 'Phiên làm việc hết hạn hoặc chưa đăng nhập' };
    }

    const res = await fetch(`${GATEWAY_URL}/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: resData.message || 'Không thể lấy thông tin cuộc trò chuyện',
      };
    }

    return { success: true, data: resData.data };
  } catch (error: any) {
    console.error('getConversationAction error:', error);
    return { success: false, error: error?.message || 'Lỗi khi lấy cuộc trò chuyện' };
  }
}

export async function getConversationsAction() {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    const currentUserId = session?.user?.id;

    if (!token || !currentUserId) {
      return { success: false, error: 'Phiên làm việc hết hạn hoặc chưa đăng nhập' };
    }

    const res = await fetch(`${GATEWAY_URL}/conversations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: resData.message || 'Không thể lấy danh sách cuộc trò chuyện',
      };
    }

    return { success: true, data: resData.data };
  } catch (error: any) {
    console.error('getConversationsAction error:', error);
    return { success: false, error: error?.message || 'Lỗi khi lấy danh sách cuộc trò chuyện' };
  }
}

export async function getPopulatedConversationsAction() {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    const currentUserId = session?.user?.id;

    if (!token || !currentUserId) {
      return { success: false, error: 'Phiên làm việc hết hạn hoặc chưa đăng nhập', data: [] };
    }

    const res = await fetch(`${GATEWAY_URL}/conversations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: resData.message || 'Không thể lấy danh sách cuộc trò chuyện',
        data: [],
      };
    }

    const conversations: any[] = resData.data || [];
    const userCache = new Map<string, any>();

    const populated = await Promise.all(
      conversations.map(async (conv) => {
        const targetUserId =
          conv.participantIds?.find((id: string) => id !== currentUserId) || conv.participantIds?.[0];
        let recipient = null;
        if (targetUserId) {
          if (userCache.has(targetUserId)) {
            recipient = userCache.get(targetUserId);
          } else {
            try {
              recipient = await userService.getById(targetUserId);
              userCache.set(targetUserId, recipient);
            } catch (e) {
              console.error(`Failed to fetch user ${targetUserId}:`, e);
            }
          }
        }
        return {
          ...conv,
          recipient,
        };
      }),
    );

    return { success: true, data: populated };
  } catch (error: any) {
    console.error('getPopulatedConversationsAction error:', error);
    return { success: false, error: error?.message || 'Lỗi khi lấy danh sách cuộc trò chuyện', data: [] };
  }
}

export async function getUserByIdAction(userId: string) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Chưa đăng nhập' };
    }
    const user = await userService.getById(userId);
    return { success: true, data: user };
  } catch (error: any) {
    console.error('getUserByIdAction error:', error);
    return { success: false, error: error?.message || 'Không thể lấy thông tin người dùng' };
  }
}

export async function getMessagesAction(conversationId: string) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) {
      return { success: false, error: 'Chưa đăng nhập', data: [] };
    }

    const res = await fetch(`${GATEWAY_URL}/conversations/${conversationId}/messages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: resData.message || 'Không thể lấy tin nhắn',
        data: [],
      };
    }

    return { success: true, data: resData.data || [] };
  } catch (error: any) {
    console.error('getMessagesAction error:', error);
    return { success: false, error: error?.message || 'Lỗi khi lấy tin nhắn', data: [] };
  }
}

export async function sendMessageAction(conversationId: string, body: string) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) {
      return { success: false, error: 'Chưa đăng nhập' };
    }

    const res = await fetch(`${GATEWAY_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body }),
    });

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: resData.message || 'Không thể gửi tin nhắn',
      };
    }

    return { success: true, data: resData.data };
  } catch (error: any) {
    console.error('sendMessageAction error:', error);
    return { success: false, error: error?.message || 'Lỗi khi gửi tin nhắn' };
  }
}

export async function addReactionAction(conversationId: string, messageId: string, emoji: string) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) {
      return { success: false, error: 'Chưa đăng nhập' };
    }

    const res = await fetch(
      `${GATEWAY_URL}/conversations/${conversationId}/messages/${messageId}/reactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      },
    );

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: resData.message || 'Không thể cập nhật biểu cảm',
      };
    }

    return { success: true, data: resData.data };
  } catch (error: any) {
    console.error('addReactionAction error:', error);
    return { success: false, error: error?.message || 'Lỗi khi thêm biểu cảm' };
  }
}

export async function markConversationAsReadAction(conversationId: string) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) {
      return { success: false, error: 'Chưa đăng nhập' };
    }

    const res = await fetch(`${GATEWAY_URL}/conversations/${conversationId}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: resData.message || 'Không thể đánh dấu đã đọc',
      };
    }

    return { success: true, data: resData.data };
  } catch (error: any) {
    console.error('markConversationAsReadAction error:', error);
    return { success: false, error: error?.message || 'Lỗi khi đánh dấu đã đọc' };
  }
}
