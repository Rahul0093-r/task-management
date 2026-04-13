import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const adminEmail = process.env.ADMIN_CREDENTIALS_EMAIL?.trim();
    const adminPassword = process.env.ADMIN_CREDENTIALS_PASSWORD?.trim();

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error.' },
        { status: 500 }
      );
    }

    if (email.trim() !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: 'admin-user',
        email: email,
        displayName: 'Administrator'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
