import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.GATE_WAY_URL || 'http://127.0.0.1:4000';

// Proxy đăng ký tài khoản: Browser -> Next.js (server) -> Gateway
// Giúp client không cần biết URL của gateway và tránh lỗi CORS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${GATEWAY_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Registration failed' },
        { status: res.status },
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[Register Error]', error);
    return NextResponse.json(
      { error: 'Cannot connect to server. Please try again later.' },
      { status: 500 },
    );
  }
}
