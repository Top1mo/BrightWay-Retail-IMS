'use client';

import React, { useState, useEffect } from 'react';
import { useRole } from '../layout';
import { downloadCSV } from '@/lib/export';
import {
  FileBarChart2,
  Download,
  Printer,
  DollarSign,
  AlertTriangle,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function ReportsPage() {
  const { branchId } = useRole();
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [branchSummaries, setBranchSummaries] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState<'DAILY_SALES' | 'LOW_STOCK'>('DAILY_SALES');

  const loadReportData = async () => {
    setLoading(true);
    try {
      const url = branchId ? `/api/reports?branchId=${branchId}` : `/api/reports`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSalesHistory(data.salesHistory);
        setBranchSummaries(data.branchSummaries);
        setLowStockItems(data.lowStockItems);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [branchId]);

  const handleExportCSV = () => {
    if (activeReportTab === 'DAILY_SALES') {
      const exportData = salesHistory.map((s) => ({
        SaleID: s.id,
        Branch: s.branch?.name,
        Customer: s.customerName || 'Walk-in',
        PaymentMethod: s.paymentMethod,
        DiscountAmount: s.discountAmount,
        TotalAmount: s.totalAmount,
        Date: new Date(s.createdAt).toLocaleString(),
      }));
      downloadCSV('BrightWay_Daily_Sales_Summary', exportData);
    } else {
      const exportData = lowStockItems.map((item) => ({
        Branch: item.branchName,
        Product: item.productName,
        Category: item.categoryName,
        CurrentStock: item.currentStock,
        SafetyThreshold: item.threshold,
        UnitPrice: item.unitPrice,
        Status: item.status,
      }));
      downloadCSV('BrightWay_Company_Low_Stock_Report', exportData);
    }
  };

  const totalRevenueAllBranches = branchSummaries.reduce((a, b) => a + b.totalRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <FileBarChart2 className="h-4 w-4 text-emerald-600" />
            <span>Single Source of Truth Reporting</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Executive & Branch Audit Reports</h2>
          <p className="text-sm text-slate-500 mt-1">
            Same-day sales summaries and low stock alerts across all 6 operational branches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV Data</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors shadow-2xs"
          >
            <Printer className="h-4 w-4" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Combined Sales Revenue</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ${totalRevenueAllBranches.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all reporting branches</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Sales Completed</span>
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {salesHistory.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Point of transaction records</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Low Stock Warning Items</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {lowStockItems.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Items requiring replenishment</div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveReportTab('DAILY_SALES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'DAILY_SALES'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
          }`}
        >
          Daily Sales Summary per Branch
        </button>

        <button
          onClick={() => setActiveReportTab('LOW_STOCK')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'LOW_STOCK'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
          }`}
        >
          Company-wide Low Stock Product Report
        </button>
      </div>

      {/* Tab 1: Daily Sales Summary */}
      {activeReportTab === 'DAILY_SALES' && (
        <div className="space-y-6">
          {/* Branch Revenue Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchSummaries.map((bs) => (
              <div key={bs.branchName} className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                    <span>{bs.branchName}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                    {bs.totalSales} Sales
                  </span>
                </div>

                <div className="text-xl font-bold text-emerald-600">
                  ${bs.totalRevenue.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500">
                  Total Discounts Allowed: ${bs.totalDiscounts.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Sales History Log Table */}
          <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-900">
              Individual Transaction Logs
            </div>
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading transactions...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-4">Receipt ID</th>
                      <th className="p-4">Branch</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Discount</th>
                      <th className="p-4">Grand Total</th>
                      <th className="p-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesHistory.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono text-slate-400 text-[11px]">#{s.id.slice(0, 8)}</td>
                        <td className="p-4 font-bold text-slate-900">{s.branch?.name}</td>
                        <td className="p-4 text-slate-700">{s.customerName || 'Walk-in'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            s.paymentMethod === 'Cash' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {s.paymentMethod}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">${s.discountAmount.toFixed(2)}</td>
                        <td className="p-4 font-bold text-indigo-600">${s.totalAmount.toFixed(2)}</td>
                        <td className="p-4 text-slate-400 text-[11px]">{new Date(s.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Low Stock Report */}
      {activeReportTab === 'LOW_STOCK' && (
        <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading low stock report...</div>
          ) : lowStockItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No low stock items! Stock levels healthy across all branches.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-4">Branch Location</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Current Stock</th>
                    <th className="p-4">Configured Min Threshold</th>
                    <th className="p-4">Unit Price</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{item.branchName}</td>
                      <td className="p-4 text-slate-800 font-semibold">{item.productName}</td>
                      <td className="p-4 text-slate-500">{item.categoryName}</td>
                      <td className="p-4 font-bold text-amber-600">
                        {item.currentStock} {item.unitOfMeasure}
                      </td>
                      <td className="p-4 text-slate-500">{item.threshold}</td>
                      <td className="p-4 text-slate-700">${item.unitPrice.toFixed(2)}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="h-3 w-3" /> LOW STOCK
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
