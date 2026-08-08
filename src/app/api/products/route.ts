import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const products = await db.product.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, categoryId, unitPrice, unitOfMeasure } = body;

    if (!name || !categoryId || unitPrice === undefined || !unitOfMeasure) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const product = await db.product.create({
      data: {
        name,
        categoryId,
        unitPrice: parseFloat(unitPrice),
        unitOfMeasure,
        isActive: true,
      },
      include: { category: true },
    });

    // Initialize inventory record for all branches
    const branches = await db.branch.findMany();
    for (const b of branches) {
      if (b.name !== 'Head Office') {
        await db.branchInventory.create({
          data: {
            branchId: b.id,
            productId: product.id,
            quantity: 0,
            lowStockThreshold: 10,
          },
        });
      }
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, categoryId, unitPrice, unitOfMeasure, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(categoryId && { categoryId }),
        ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) }),
        ...(unitOfMeasure && { unitOfMeasure }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { category: true },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
