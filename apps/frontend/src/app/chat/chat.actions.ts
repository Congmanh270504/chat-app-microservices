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
    return { success: false, error: error?.message || 'Cannot get user list' };
  }
}

export async function createConversationAction(targetUserId: string, conversationId?: string) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    const currentUserId = session?.user?.id;

    if (!token || !currentUserId) {
      return { success: false, error: 'User not found or unauthorized' };
    }

    const payload: { participantIds: string[]; id?: string } = {
      participantIds: [currentUserId, targetUserId],
    };
    if (conversationId) {
      payload.id = conversationId;
    }

    const res = await fetch(`${GATEWAY_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: resData.message || 'Cannot create conversation',
      };
    }

    return { success: true, data: resData.data };
  } catch (error: any) {
    console.error('createConversationAction error:', error);
    return { success: false, error: error?.message || 'Error creating conversation' };
  }
}

export async function createGroupAction({
  title,
  participantIds,
}: {
  title: string;
  participantIds: string[];
}) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    const currentUserId = session?.user?.id;

    if (!token || !currentUserId) {
      return { success: false, error: 'User not found or unauthorized' };
    }

    const uniqueParticipants = Array.from(new Set([currentUserId, ...participantIds]));
    if (uniqueParticipants.length < 3) {
      return { success: false, error: 'Group must have at least 3 members' };
    }

    const res = await fetch(`${GATEWAY_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        participantIds: uniqueParticipants,
      }),
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: resData.message || 'Cannot create group',
      };
    }

    return { success: true, data: resData.data };
  } catch (error: any) {
    console.error('createGroupAction error:', error);
    return { success: false, error: error?.message || 'Error creating group' };
  }
}

export async function getConversationAction(conversationId: string) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    const currentUserId = session?.user?.id;

    if (!token || !currentUserId) {
      return { success: false, error: 'User not found or unauthorized' };
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
        error: resData.message || 'Cannot get conversation details',
      };
    }

    return { success: true, data: resData.data };
  } catch (error: any) {
    console.error('getConversationAction error:', error);
    return { success: false, error: error?.message || 'Error getting conversation' };
  }
}

export async function getConversationsAction() {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    const currentUserId = session?.user?.id;

    if (!token || !currentUserId) {
      return { success: false, error: 'Session expired or not logged in' };
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
        error: resData.message || 'Cannot get conversations list',
      };
    }

    return { success: true, data: resData.data };
  } catch (error: any) {
    console.error('getConversationsAction error:', error);
    return { success: false, error: error?.message || 'Error getting conversations list' };
  }
}

export async function getPopulatedConversationsAction() {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    const currentUserId = session?.user?.id;

    if (!token || !currentUserId) {
      return { success: false, error: 'Session expired or not logged in', data: [] };
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
        error: resData.message || 'Cannot get conversations list',
        data: [],
      };
    }

    const conversations: any[] = resData.data || [];
    const userCache = new Map<string, any>();

    const populated = await Promise.all(
      conversations.map(async (conv) => {
        const isGroup =
          conv.isGroup ||
          (conv.participantIds && conv.participantIds.length > 2) ||
          Boolean(conv.title);

        if (isGroup) {
          return {
            ...conv,
            isGroup: true,
            title: conv.title || `Group (${conv.participantIds?.length || 0} members)`,
            recipient: null,
          };
        }

        const targetUserId =
          conv.participantIds?.find((id: string) => id !== currentUserId) ||
          conv.participantIds?.[0];
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
    return {
      success: false,
      error: error?.message || 'Error getting conversations list',
      data: [],
    };
  }
}

export async function getUserByIdAction(userId: string) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }
    const user = await userService.getById(userId);
    return { success: true, data: user };
  } catch (error: any) {
    console.error('getUserByIdAction error:', error);
    return { success: false, error: error?.message || 'Cannot get user information' };
  }
}

export async function getMessagesAction(conversationId: string) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) {
      return { success: false, error: 'Not authenticated', data: [] };
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
      if (res.status === 404) {
        return { success: true, data: [] };
      }
      return {
        success: false,
        error: resData.message || 'Cannot get messages',
        data: [],
      };
    }

    return { success: true, data: resData.data || [] };
  } catch (error: any) {
    console.error('getMessagesAction error:', error);
    return { success: false, error: error?.message || 'Error getting messages', data: [] };
  }
}

export async function sendMessageAction(conversationId: string, body: string) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) {
      return { success: false, error: 'Not authenticated' };
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
        error: resData.message || 'Cannot send message',
      };
    }

    return { success: true, data: resData.data };
  } catch (error: any) {
    console.error('sendMessageAction error:', error);
    return { success: false, error: error?.message || 'Error sending message' };
  }
}

export async function addReactionAction(conversationId: string, messageId: string, emoji: string) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) {
      return { success: false, error: 'Not authenticated' };
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
        error: resData.message || 'Cannot update reaction',
      };
    }

    return { success: true, data: resData.data };
  } catch (error: any) {
    console.error('addReactionAction error:', error);
    return { success: false, error: error?.message || 'Error adding reaction' };
  }
}

export async function markConversationAsReadAction(conversationId: string) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) {
      return { success: false, error: 'Not authenticated' };
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
      if (res.status === 404) {
        return { success: true, data: null };
      }
      return {
        success: false,
        error: resData.message || 'Cannot mark as read',
      };
    }

    return { success: true, data: resData.data };
  } catch (error: any) {
    console.error('markConversationAsReadAction error:', error);
    return { success: false, error: error?.message || 'Error marking as read' };
  }
}

export async function getUnreadCountAction(): Promise<{
  success: boolean;
  data?: number;
  error?: string;
}> {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    const currentUserId = session?.user?.id;

    if (!token || !currentUserId) {
      return { success: false, data: 0 };
    }

    const res = await fetch(`${GATEWAY_URL}/conversations/unread-count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, data: 0, error: resData.message };
    }

    return { success: true, data: resData.data?.count ?? 0 };
  } catch (error: any) {
    console.error('getUnreadCountAction error:', error);
    return { success: false, data: 0, error: error?.message };
  }
}

export async function searchMessagesAction(
  conversationId: string,
  query: string,
  limit: number = 20,
  offset: number = 0,
) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) {
      return { success: false, error: 'Not authenticated', data: { hits: [], totalHits: 0 } };
    }

    if (!query || !query.trim()) {
      return { success: true, data: { hits: [], totalHits: 0 } };
    }

    const params = new URLSearchParams({
      q: query.trim(),
      limit: String(limit),
      offset: String(offset),
    });

    const res = await fetch(
      `${GATEWAY_URL}/conversations/${conversationId}/messages/search?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      },
    );

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: resData.message || 'Failed to search messages',
        data: { hits: [], totalHits: 0 },
      };
    }

    return { success: true, data: resData.data };
  } catch (error: any) {
    console.error('searchMessagesAction error:', error);
    return {
      success: false,
      error: error?.message || 'Error searching messages',
      data: { hits: [], totalHits: 0 },
    };
  }
}
