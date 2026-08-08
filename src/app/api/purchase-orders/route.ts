import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const purchaseOrders = await db.purchaseOrder.findMany({
      include: {
        supplier: true,
        branch: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, purchaseOrders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { supplierId, branchId, items } = body;

    if (!supplierId || !branchId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Supplier, target branch, and order items are required' }, { status: 400 });
    }

    const po = await db.purchaseOrder.create({
      data: {
        supplierId,
        branchId,
        status: 'OPEN',
        items: {
          create: items.map((i: any) => ({
            productId: i.productId,
            orderedQty: parseInt(i.orderedQty),
            receivedQty: 0,
            unitCost: parseFloat(i.unitCost),
          })),
        },
      },
      include: {
        supplier: true,
        branch: true,
        items: { include: { product: true } },
      },
    });

    return NextResponse.json({ success: true, purchaseOrder: po });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { poId, receivedItems } = body; // receivedItems: [{ itemId, newlyReceivedQty }]

    if (!poId || !receivedItems || !Array.isArray(receivedItems)) {
      return NextResponse.json({ success: false, error: 'poId and receivedItems are required' }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true },
      });

      if (!po) {
        throw new Error('Purchase Order not found');
      }

      for (const rec of receivedItems) {
        const item = po.items.find((i) => i.id === rec.itemId);
        if (!item) continue;

        const addQty = parseInt(rec.newlyReceivedQty || 0);
        if (addQty <= 0) continue;

        const updatedReceived = item.receivedQty + addQty;

        // 1. Update PO item received quantity
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQty: updatedReceived },
        });

        // 2. Increment stock in target branch inventory
        await tx.branchInventory.upsert({
          where: {
            branchId_productId: {
              branchId: po.branchId,
              productId: item.productId,
            },
          },
          update: { quantity: { increment: addQty } },
          create: {
            branchId: po.branchId,
            productId: item.productId,
            quantity: addQty,
            lowStockThreshold: 10,
          },
        });
      }

      // 3. Re-evaluate PO status
      const updatedPoItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: poId },
      });

      const allFulfilled = updatedPoItems.every((i) => i.receivedQty >= i.orderedQty);
      const someReceived = updatedPoItems.some((i) => i.receivedQty > 0);

      const newStatus = allFulfilled ? 'FULFILLED' : someReceived ? 'PARTIAL' : 'OPEN';

      const finalPo = await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: newStatus },
        include: { supplier: true, branch: true, items: { include: { product: true } } },
      });

      return finalPo;
    });

    return NextResponse.json({ success: true, purchaseOrder: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
