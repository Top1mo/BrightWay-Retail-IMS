import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const users = await db.user.findMany({
      include: { branch: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, role, branchId } = await request.json();
    if (!name || !email || !role) {
      return NextResponse.json({ success: false, error: 'Name, email, and role are required' }, { status: 400 });
    }
    const user = await db.user.create({
      data: { name, email, role, branchId: branchId || null },
      include: { branch: true },
    });
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
