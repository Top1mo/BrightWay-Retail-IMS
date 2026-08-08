import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    // 1. Daily Sales Summary by Branch
    const salesWhere: any = {};
    if (branchId) {
      salesWhere.branchId = branchId;
    }

    const sales = await db.sale.findMany({
      where: salesWhere,
      include: {
        branch: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const branchSummariesMap: Record<string, { branchName: string; totalSales: number; totalRevenue: number; totalDiscounts: number }> = {};

    for (const sale of sales) {
      const bName = sale.branch.name;
      if (!branchSummariesMap[bName]) {
        branchSummariesMap[bName] = { branchName: bName, totalSales: 0, totalRevenue: 0, totalDiscounts: 0 };
      }
      branchSummariesMap[bName].totalSales += 1;
      branchSummariesMap[bName].totalRevenue += sale.totalAmount;
      branchSummariesMap[bName].totalDiscounts += sale.discountAmount;
    }

    const branchSummaries = Object.values(branchSummariesMap);

    // 2. Company-wide Low Stock Report
    const allInventory = await db.branchInventory.findMany({
      include: { branch: true, product: { include: { category: true } } },
    });

    const lowStockItems = allInventory
      .filter((item) => item.quantity <= item.lowStockThreshold)
      .map((item) => ({
        id: item.id,
        branchName: item.branch.name,
        productName: item.product.name,
        categoryName: item.product.category.name,
        currentStock: item.quantity,
        threshold: item.lowStockThreshold,
        unitOfMeasure: item.product.unitOfMeasure,
        unitPrice: item.product.unitPrice,
        status: item.quantity === 0 ? 'OUT_OF_STOCK' : 'CRITICAL_LOW',
      }));

    return NextResponse.json({
      success: true,
      salesHistory: sales,
      branchSummaries,
      lowStockItems,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
