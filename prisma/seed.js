const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BrightWay Retail database...');

  // 1. Clear existing data
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.branchInventory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.branch.deleteMany();

  // 2. Create Branches
  const headOffice = await prisma.branch.create({
    data: { name: 'Head Office', location: 'Corporate Center, Tower A, HQ' },
  });

  const downtown = await prisma.branch.create({
    data: { name: 'Downtown Flagship', location: '101 Main St, Central Business District' },
  });

  const northside = await prisma.branch.create({
    data: { name: 'Northside Hub', location: '405 Northway Ave, Suite 12' },
  });

  const westend = await prisma.branch.create({
    data: { name: 'West End Branch', location: '789 Westside Blvd' },
  });

  const eastside = await prisma.branch.create({
    data: { name: 'Eastside Outlet', location: '321 East Commerce Rd' },
  });

  const metro = await prisma.branch.create({
    data: { name: 'Metro Central', location: '555 Metro Plaza, Station Level' },
  });

  const airport = await prisma.branch.create({
    data: { name: 'Airport Express', location: 'Terminal 2 Concourse B, Gate 14' },
  });

  const operationalBranches = [downtown, northside, westend, eastside, metro, airport];

  // 3. Create Users (1 for each of the 7 Roles)
  await prisma.user.createMany({
    data: [
      { id: 'usr-admin', name: 'Alice Morgan (Admin)', email: 'admin@brightway.com', role: 'SYS_ADMIN', branchId: headOffice.id },
      { id: 'usr-director', name: 'David Sterling (Director)', email: 'director@brightway.com', role: 'OPS_DIRECTOR', branchId: headOffice.id },
      { id: 'usr-purchasing', name: 'Pamela Vance (Purchasing)', email: 'purchasing@brightway.com', role: 'PURCHASING', branchId: headOffice.id },
      { id: 'usr-manager', name: 'Mark Gable (Manager)', email: 'manager.downtown@brightway.com', role: 'BRANCH_MANAGER', branchId: downtown.id },
      { id: 'usr-inventory', name: 'Ian Wright (Inventory Staff)', email: 'inventory.downtown@brightway.com', role: 'INVENTORY_STAFF', branchId: downtown.id },
      { id: 'usr-cashier', name: 'Chloe Adams (Cashier)', email: 'cashier.downtown@brightway.com', role: 'CASHIER', branchId: downtown.id },
      { id: 'usr-finance', name: 'Fiona Gallagher (Finance)', email: 'finance@brightway.com', role: 'FINANCE', branchId: headOffice.id },
    ],
  });

  // 4. Create Categories
  const catBeverages = await prisma.category.create({ data: { name: 'Beverages' } });
  const catBakery = await prisma.category.create({ data: { name: 'Bakery & Grains' } });
  const catSnacks = await prisma.category.create({ data: { name: 'Snacks & Confectionery' } });
  const catDairy = await prisma.category.create({ data: { name: 'Dairy & Fresh' } });
  const catHousehold = await prisma.category.create({ data: { name: 'Household & Cleaning' } });

  // 5. Create Products
  const productsData = [
    { name: 'Organic Whole Milk 1L', categoryId: catDairy.id, unitPrice: 3.49, unitOfMeasure: 'Liter' },
    { name: 'Artisanal Sourdough 500g', categoryId: catBakery.id, unitPrice: 4.99, unitOfMeasure: 'Loaf' },
    { name: 'Premium Ground Coffee 250g', categoryId: catBeverages.id, unitPrice: 8.99, unitOfMeasure: 'Pack' },
    { name: 'Mineral Water 500ml', categoryId: catBeverages.id, unitPrice: 1.25, unitOfMeasure: 'Bottle' },
    { name: 'Dark Chocolate Bar 100g', categoryId: catSnacks.id, unitPrice: 2.75, unitOfMeasure: 'Bar' },
    { name: 'Laundry Detergent Pods 30pk', categoryId: catHousehold.id, unitPrice: 14.50, unitOfMeasure: 'Box' },
    { name: 'Olive Oil Extra Virgin 750ml', categoryId: catDairy.id, unitPrice: 11.99, unitOfMeasure: 'Bottle' },
    { name: 'Green Tea Bags 50pk', categoryId: catBeverages.id, unitPrice: 5.49, unitOfMeasure: 'Box' },
    { name: 'Fruit Granola 500g', categoryId: catBakery.id, unitPrice: 6.25, unitOfMeasure: 'Bag' },
    { name: 'Multi-Surface Cleaner 750ml', categoryId: catHousehold.id, unitPrice: 4.80, unitOfMeasure: 'Spray Bottle' },
  ];

  const products = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({ data: p });
    products.push(prod);
  }

  // 6. Create Branch Inventory
  for (const branch of operationalBranches) {
    for (let i = 0; i < products.length; i++) {
      const prod = products[i];
      // Vary quantities so some trigger low stock alerts (< lowStockThreshold)
      let initialQty = 45;
      let threshold = 10;

      if (i === 1) { // Sourdough
        initialQty = branch.id === downtown.id ? 4 : 2; // Low stock!
        threshold = 10;
      } else if (i === 2) { // Coffee
        initialQty = branch.id === downtown.id ? 8 : 15; // Downtown low stock!
        threshold = 12;
      } else if (i === 5) { // Detergent
        initialQty = branch.id === northside.id ? 3 : 28;
        threshold = 10;
      }

      await prisma.branchInventory.create({
        data: {
          branchId: branch.id,
          productId: prod.id,
          quantity: initialQty,
          lowStockThreshold: threshold,
        },
      });
    }
  }

  // 7. Create Suppliers
  const s1 = await prisma.supplier.create({
    data: {
      companyName: 'FreshGrid Logistics Ltd.',
      contactPerson: 'Sarah Jenkins',
      phone: '+1-800-555-0199',
    },
  });

  const s2 = await prisma.supplier.create({
    data: {
      companyName: 'Apex Consumer Goods Inc.',
      contactPerson: 'Marcus Vance',
      phone: '+1-800-555-0288',
    },
  });

  const s3 = await prisma.supplier.create({
    data: {
      companyName: 'Artisan Bakers Supply',
      contactPerson: 'Elena Rostova',
      phone: '+1-800-555-0377',
    },
  });

  // 8. Create Purchase Orders
  const po1 = await prisma.purchaseOrder.create({
    data: {
      supplierId: s1.id,
      branchId: downtown.id,
      status: 'OPEN',
      items: {
        create: [
          { productId: products[0].id, orderedQty: 100, receivedQty: 0, unitCost: 2.10 },
          { productId: products[2].id, orderedQty: 50, receivedQty: 0, unitCost: 5.50 },
        ],
      },
    },
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      supplierId: s3.id,
      branchId: northside.id,
      status: 'PARTIAL',
      items: {
        create: [
          { productId: products[1].id, orderedQty: 80, receivedQty: 40, unitCost: 3.00 },
        ],
      },
    },
  });

  // 9. Create Sample Inter-Branch Stock Transfers
  await prisma.stockTransfer.create({
    data: {
      sendingBranchId: westend.id,
      receivingBranchId: downtown.id,
      productId: products[1].id,
      quantity: 15,
      status: 'PENDING',
    },
  });

  await prisma.stockTransfer.create({
    data: {
      sendingBranchId: downtown.id,
      receivingBranchId: northside.id,
      productId: products[3].id,
      quantity: 20,
      status: 'COMPLETED',
    },
  });

  // 10. Create Sample Sales
  const sale1 = await prisma.sale.create({
    data: {
      branchId: downtown.id,
      cashierId: 'usr-cashier',
      customerName: 'Robert Vance',
      customerPhone: '+1-555-0144',
      discountAmount: 2.00,
      totalAmount: 20.47,
      paymentMethod: 'Cash',
      items: {
        create: [
          { productId: products[0].id, quantity: 2, unitPrice: 3.49, subtotal: 6.98 },
          { productId: products[2].id, quantity: 1, unitPrice: 8.99, subtotal: 8.99 },
          { productId: products[4].id, quantity: 2, unitPrice: 2.75, subtotal: 5.50 },
        ],
      },
    },
  });

  const sale2 = await prisma.sale.create({
    data: {
      branchId: downtown.id,
      cashierId: 'usr-cashier',
      customerName: 'Alice Miller',
      customerPhone: '+1-555-0899',
      discountAmount: 0.00,
      totalAmount: 18.24,
      paymentMethod: 'Card',
      items: {
        create: [
          { productId: products[6].id, quantity: 1, unitPrice: 11.99, subtotal: 11.99 },
          { productId: products[8].id, quantity: 1, unitPrice: 6.25, subtotal: 6.25 },
        ],
      },
    },
  });

  console.log('Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
