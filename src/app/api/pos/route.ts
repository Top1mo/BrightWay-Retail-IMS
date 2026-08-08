import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { branchId, cashierId, customerName, customerPhone, discountAmount, paymentMethod, items } = body;

    if (!branchId || !cashierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing branchId, cashierId, or cart items' }, { status: 400 });
    }

    const discount = parseFloat(discountAmount || 0);

    // ATOMIC POS CHECKOUT TRANSACTION
    const sale = await db.$transaction(async (tx) => {
      let itemsSubtotal = 0;
      const saleItemsToCreate = [];

      // 1. Verify stock and prepare line items
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || !product.isActive) {
          throw new Error(`Product ${item.productId} is not available for sale.`);
        }

        const inv = await tx.branchInventory.findUnique({
          where: {
            branchId_productId: {
              branchId,
              productId: item.productId,
            },
          },
        });

        if (!inv || inv.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${inv?.quantity || 0}, Requested: ${item.quantity}`
          );
        }

        // Decrement stock
        await tx.branchInventory.update({
          where: { id: inv.id },
          data: { quantity: { decrement: item.quantity } },
        });

        const lineSubtotal = product.unitPrice * item.quantity;
        itemsSubtotal += lineSubtotal;

        saleItemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.unitPrice,
          subtotal: lineSubtotal,
        });
      }

      const totalAmount = Math.max(0, itemsSubtotal - discount);

      // 2. Create Sale Record
      const createdSale = await tx.sale.create({
        data: {
          branchId,
          cashierId,
          customerName: customerName || 'Guest Customer',
          customerPhone: customerPhone || null,
          discountAmount: discount,
          totalAmount,
          paymentMethod: paymentMethod || 'Cash',
          items: {
            create: saleItemsToCreate,
          },
        },
        include: {
          branch: true,
          items: {
            include: { product: true },
          },
        },
      });

      return createdSale;
    });

    return NextResponse.json({ success: true, sale });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
