'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRole } from '../layout';
import {
  DollarSign,
  AlertTriangle,
  ArrowRightLeft,
  PackageCheck,
  ShoppingCart,
  Boxes,
  Truck,
  FileBarChart2,
  CheckCircle2,
  TrendingUp,
  Building2,
} from 'lucide-react';

export default function DashboardPage() {
  const { role, branchId, branchName } = useRole();
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    salesCount: 0,
    lowStockCount: 0,
    pendingTransfersCount: 0,
    activeProductsCount: 0,
  });
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const invUrl = branchId ? `/api/inventory?branchId=${branchId}&lowStockOnly=true` : `/api/inventory?lowStockOnly=true`;
        const invRes = await fetch(invUrl);
        const invData = await invRes.json();

        const transUrl = branchId ? `/api/transfers?branchId=${branchId}` : `/api/transfers`;
        const transRes = await fetch(transUrl);
        const transData = await transRes.json();

        const repUrl = branchId ? `/api/reports?branchId=${branchId}` : `/api/reports`;
        const repRes = await fetch(repUrl);
        const repData = await repRes.json();

        const prodRes = await fetch('/api/products?activeOnly=true');
        const prodData = await prodRes.json();

        const lowStock = invData.success ? invData.inventory : [];
        const transfers = transData.success ? transData.transfers.filter((t: any) => t.status === 'PENDING') : [];
        const sales = repData.success ? repData.salesHistory : [];

        const totalRev = sales.reduce((acc: number, s: any) => acc + (s.totalAmount || 0), 0);

        setMetrics({
          totalRevenue: totalRev,
          salesCount: sales.length,
          lowStockCount: lowStock.length,
          pendingTransfersCount: transfers.length,
          activeProductsCount: prodData.success ? prodData.products.length : 0,
        });

        setLowStockItems(lowStock.slice(0, 5));
        setPendingTransfers(transfers.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [role, branchId]);

  return (
    <div className="space-y-6">
      {/* Scope Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <span>Scope: {branchName}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Operational Control Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry for stock levels, point-of-sale activity, and inter-branch logistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {['CASHIER', 'BRANCH_MANAGER', 'SYS_ADMIN'].includes(role) && (
            <Link
              href="/pos"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Open POS Cashier</span>
            </Link>
          )}

          {['BRANCH_MANAGER', 'INVENTORY_STAFF', 'SYS_ADMIN'].includes(role) && (
            <Link
              href="/transfers"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-all shadow-2xs"
            >
              <ArrowRightLeft className="h-4 w-4 text-slate-500" />
              <span>Stock Transfer</span>
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Revenue */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Sales Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              ${metrics.totalRevenue.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span>{metrics.salesCount} Completed Transactions</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Low Stock Warnings</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {metrics.lowStockCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {metrics.lowStockCount > 0 ? 'Items below threshold' : 'All stock healthy'}
            </div>
          </div>
        </div>

        {/* Pending Transfers */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Transfers</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {metrics.pendingTransfersCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Awaiting approval/receipt
            </div>
          </div>
        </div>

        {/* Active Products */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active SKUs Catalog</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <PackageCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {metrics.activeProductsCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Active products in system
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Low Stock & Pending Transfers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts Widget */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">Critical Low Stock Alerts</h3>
            </div>
            <Link
              href="/inventory"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              View All Inventory →
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading stock alerts...</div>
          ) : lowStockItems.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="text-xs text-slate-500">No low-stock alerts! All product quantities meet safety thresholds.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="glass-card p-3 rounded-xl flex items-center justify-between border border-slate-200"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{item.product.name}</div>
                    <div className="text-[11px] text-slate-500">
                      Branch: {item.branch.name} • Category: {item.product.category?.name || 'General'}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
                      {item.quantity} {item.product.unitOfMeasure} (Min: {item.lowStockThreshold})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Transfers Queue */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="h-5 w-5 text-cyan-600" />
              <h3 className="text-base font-bold text-slate-900">Inter-Branch Transfers Queue</h3>
            </div>
            <Link
              href="/transfers"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Manage Transfers →
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading transfer queue...</div>
          ) : pendingTransfers.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="text-xs text-slate-500">No pending transfers. All inter-branch requests processed.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTransfers.map((t) => (
                <div
                  key={t.id}
                  className="glass-card p-3 rounded-xl flex items-center justify-between border border-slate-200"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {t.product?.name} ({t.quantity} units)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      From: <span className="font-semibold text-slate-700">{t.sendingBranch?.name}</span> → To: <span className="font-semibold text-slate-700">{t.receivingBranch?.name}</span>
                    </div>
                  </div>

                  <div>
                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-lg">
                      PENDING
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modules Quick Shortcuts Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-slate-900">Quick Module Navigation</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/pos"
            className="glass-card p-4 rounded-xl text-center hover:border-indigo-300 transition-all group"
          >
            <ShoppingCart className="h-6 w-6 text-indigo-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">POS Checkout</div>
            <div className="text-[10px] text-slate-500 mt-0.5">High-Speed Sales</div>
          </Link>

          <Link
            href="/inventory"
            className="glass-card p-4 rounded-xl text-center hover:border-indigo-300 transition-all group"
          >
            <Boxes className="h-6 w-6 text-cyan-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">Inventory</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Stock & Thresholds</div>
          </Link>

          <Link
            href="/transfers"
            className="glass-card p-4 rounded-xl text-center hover:border-indigo-300 transition-all group"
          >
            <ArrowRightLeft className="h-6 w-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">Transfers</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Inter-Branch</div>
          </Link>

          <Link
            href="/products"
            className="glass-card p-4 rounded-xl text-center hover:border-indigo-300 transition-all group"
          >
            <PackageCheck className="h-6 w-6 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">Products</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Catalog & Prices</div>
          </Link>

          <Link
            href="/purchasing"
            className="glass-card p-4 rounded-xl text-center hover:border-indigo-300 transition-all group"
          >
            <Truck className="h-6 w-6 text-amber-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">Purchasing</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Suppliers & POs</div>
          </Link>

          <Link
            href="/reports"
            className="glass-card p-4 rounded-xl text-center hover:border-indigo-300 transition-all group"
          >
            <FileBarChart2 className="h-6 w-6 text-emerald-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">Reports</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Sales & Exports</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
