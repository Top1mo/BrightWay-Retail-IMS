import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get('role') || 'SYS_ADMIN';

    // Find first user matching role or fallback
    let user = await db.user.findFirst({
      where: { role: roleParam },
      include: { branch: true },
    });

    if (!user) {
      user = await db.user.findFirst({
        include: { branch: true },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
