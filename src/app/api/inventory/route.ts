import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

    const whereClause: any = {};
    if (branchId) {
      whereClause.branchId = branchId;
    }

    const inventoryItems = await db.branchInventory.findMany({
      where: whereClause,
      include: {
        branch: true,
        product: {
          include: { category: true },
        },
      },
      orderBy: { product: { name: 'asc' } },
    });

    const enriched = inventoryItems.map((item) => ({
      ...item,
      isLowStock: item.quantity <= item.lowStockThreshold,
    }));

    const filtered = lowStockOnly ? enriched.filter((i) => i.isLowStock) : enriched;

    return NextResponse.json({ success: true, inventory: filtered });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, quantity, lowStockThreshold } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Inventory Item ID is required' }, { status: 400 });
    }

    const updated = await db.branchInventory.update({
      where: { id },
      data: {
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: parseInt(lowStockThreshold) }),
      },
      include: { branch: true, product: true },
    });

    return NextResponse.json({ success: true, inventory: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
