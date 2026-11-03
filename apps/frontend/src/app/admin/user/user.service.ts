import { User, CreateUserInput } from '@/app/admin/user/user.type';
import { auth } from '@/lib/auth';

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL ||
  process.env.NEXT_PUBLIC_USER_SERVICE_URL ||
  'http://127.0.0.1:4000/users';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) {
      console.warn('[userService] Warning: No accessToken found in session!');
    }
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  } catch (error) {
    console.error('Failed to get auth session in userService:', error);
    return { 'Content-Type': 'application/json' };
  }
};

export const userService = {
  getAll: async (): Promise<User[]> => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(USER_SERVICE_URL, {
        headers,
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch users: ${res.statusText || res.status}`);
      }

      const responseData = await res.json();
      return Array.isArray(responseData) ? responseData : responseData.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<User | null> => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${USER_SERVICE_URL}/${id}`, {
        headers,
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });

      if (!res.ok) {
        return null;
      }

      const responseData = await res.json();
      return responseData.data || responseData;
    } catch (error) {
      console.warn(`[userService] getById failed for ${id}:`, error);
      return null;
    }
  },

  create: async (data: CreateUserInput): Promise<User> => {
    const headers = await getAuthHeaders();
    const res = await fetch(USER_SERVICE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Failed to create user');
    }

    const responseData = await res.json();
    return responseData.data || responseData;
  },

  update: async (id: string, data: Partial<CreateUserInput>): Promise<User> => {
    const headers = await getAuthHeaders();
    console.log('[userService] Updating user:', id, data);
    const res = await fetch(`${USER_SERVICE_URL}/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Failed to update user');
    }

    const responseData = await res.json();
    return responseData.data || responseData;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const headers = await getAuthHeaders();
    console.log(
      '[userService] Deleting user:',
      id,

      `${USER_SERVICE_URL}/${id}`,
    );
    const res = await fetch(`${USER_SERVICE_URL}/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Failed to delete user');
    }

    return { success: true };
  },
};
