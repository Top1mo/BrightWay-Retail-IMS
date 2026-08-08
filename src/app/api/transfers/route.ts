import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    const whereClause: any = {};
    if (branchId) {
      whereClause.OR = [
        { sendingBranchId: branchId },
        { receivingBranchId: branchId },
      ];
    }

    const transfers = await db.stockTransfer.findMany({
      where: whereClause,
      include: {
        sendingBranch: true,
        receivingBranch: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, transfers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sendingBranchId, receivingBranchId, productId, quantity } = body;

    if (!sendingBranchId || !receivingBranchId || !productId || !quantity || quantity <= 0) {
      return NextResponse.json({ success: false, error: 'All fields are required and quantity must be > 0' }, { status: 400 });
    }

    if (sendingBranchId === receivingBranchId) {
      return NextResponse.json({ success: false, error: 'Sending and receiving branches must be different' }, { status: 400 });
    }

    // Verify sending branch has enough stock
    const senderInventory = await db.branchInventory.findUnique({
      where: {
        branchId_productId: {
          branchId: sendingBranchId,
          productId,
        },
      },
    });

    if (!senderInventory || senderInventory.quantity < quantity) {
      return NextResponse.json({
        success: false,
        error: `Insufficient stock at sending branch (Available: ${senderInventory?.quantity || 0}, Requested: ${quantity})`,
      }, { status: 400 });
    }

    const transfer = await db.stockTransfer.create({
      data: {
        sendingBranchId,
        receivingBranchId,
        productId,
        quantity: parseInt(quantity),
        status: 'PENDING',
      },
      include: {
        sendingBranch: true,
        receivingBranch: true,
        product: true,
      },
    });

    return NextResponse.json({ success: true, transfer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, action } = body; // action: 'COMPLETE' | 'CANCEL'

    if (!id || !['COMPLETE', 'CANCEL'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid ID or action' }, { status: 400 });
    }

    const existingTransfer = await db.stockTransfer.findUnique({
      where: { id },
    });

    if (!existingTransfer) {
      return NextResponse.json({ success: false, error: 'Stock Transfer record not found' }, { status: 404 });
    }

    if (existingTransfer.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: `Transfer is already ${existingTransfer.status}` }, { status: 400 });
    }

    if (action === 'CANCEL') {
      const updated = await db.stockTransfer.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { sendingBranch: true, receivingBranch: true, product: true },
      });
      return NextResponse.json({ success: true, transfer: updated });
    }

    // ATOMIC TRANSACTION FOR COMPLETION
    const result = await db.$transaction(async (tx) => {
      // 1. Check sender stock
      const senderStock = await tx.branchInventory.findUnique({
        where: {
          branchId_productId: {
            branchId: existingTransfer.sendingBranchId,
            productId: existingTransfer.productId,
          },
        },
      });

      if (!senderStock || senderStock.quantity < existingTransfer.quantity) {
        throw new Error(
          `Cannot complete transfer: Sender branch stock is insufficient (Available: ${senderStock?.quantity || 0}, Transfer Qty: ${existingTransfer.quantity})`
        );
      }

      // 2. Decrement sender stock
      await tx.branchInventory.update({
        where: { id: senderStock.id },
        data: { quantity: { decrement: existingTransfer.quantity } },
      });

      // 3. Increment receiver stock (upsert)
      await tx.branchInventory.upsert({
        where: {
          branchId_productId: {
            branchId: existingTransfer.receivingBranchId,
            productId: existingTransfer.productId,
          },
        },
        update: { quantity: { increment: existingTransfer.quantity } },
        create: {
          branchId: existingTransfer.receivingBranchId,
          productId: existingTransfer.productId,
          quantity: existingTransfer.quantity,
          lowStockThreshold: 10,
        },
      });

      // 4. Update status to COMPLETED
      const completedTransfer = await tx.stockTransfer.update({
        where: { id },
        data: { status: 'COMPLETED' },
        include: { sendingBranch: true, receivingBranch: true, product: true },
      });

      return completedTransfer;
    });

    return NextResponse.json({ success: true, transfer: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
