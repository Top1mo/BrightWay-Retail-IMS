import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const suppliers = await db.supplier.findMany({
      orderBy: { companyName: 'asc' },
    });
    return NextResponse.json({ success: true, suppliers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { companyName, contactPerson, phone } = await request.json();
    if (!companyName || !contactPerson || !phone) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }
    const supplier = await db.supplier.create({
      data: { companyName, contactPerson, phone },
    });
    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
