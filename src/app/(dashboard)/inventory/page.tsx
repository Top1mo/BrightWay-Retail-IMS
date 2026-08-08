'use client';

import React, { useState, useEffect } from 'react';
import { useRole } from '../layout';
import {
  Boxes,
  Search,
  AlertTriangle,
  Save,
  CheckCircle,
  Building2,
  Plus,
  Minus,
} from 'lucide-react';

export default function InventoryPage() {
  const { role, branchId } = useRole();
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branchId || '');
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editItem, setEditItem] = useState<any | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [newThreshold, setNewThreshold] = useState<number>(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await fetch('/api/branches');
        const data = await res.json();
        if (data.success) {
          setBranches(data.branches);
          if (!selectedBranchId && data.branches.length > 0) {
            const downtown = data.branches.find((b: any) => b.name.includes('Downtown')) || data.branches[0];
            setSelectedBranchId(downtown.id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadBranches();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const url = selectedBranchId
        ? `/api/inventory?branchId=${selectedBranchId}`
        : `/api/inventory`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setInventory(data.inventory);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedBranchId]);

  const handleOpenEdit = (item: any) => {
    setEditItem(item);
    setNewQuantity(item.quantity);
    setNewThreshold(item.lowStockThreshold);
  };

  const handleSaveInventory = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editItem.id,
          quantity: newQuantity,
          lowStockThreshold: newThreshold,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditItem(null);
        await fetchInventory();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.product?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLowStock = lowStockFilter ? item.isLowStock : true;
    return matchesSearch && matchesLowStock;
  });

  const canEditStock = ['SYS_ADMIN', 'BRANCH_MANAGER', 'INVENTORY_STAFF'].includes(role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Boxes className="h-4 w-4 text-indigo-600" />
            <span>Branch Inventory & Stock Control</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Telemetry & Thresholds</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time branch inventory levels with configurable low-stock alert thresholds.
          </p>
        </div>

        {/* Branch Filter Selector */}
        <div className="flex items-center space-x-3">
          <Building2 className="h-4 w-4 text-slate-400" />
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
          >
            <option value="">All Branches (Company-wide)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={() => setLowStockFilter(!lowStockFilter)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            lowStockFilter
              ? 'bg-amber-50 text-amber-700 border-amber-300'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>Low Stock Only</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading stock records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Branch</th>
                  <th className="p-4">Unit Price</th>
                  <th className="p-4">Available Quantity</th>
                  <th className="p-4">Low Stock Min</th>
                  <th className="p-4">Status</th>
                  {canEditStock && <th className="p-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      {item.product?.name}
                    </td>
                    <td className="p-4 text-slate-500 font-medium">
                      {item.product?.category?.name || 'General'}
                    </td>
                    <td className="p-4 text-slate-700 font-semibold">
                      {item.branch?.name}
                    </td>
                    <td className="p-4 text-slate-600">
                      ${item.product?.unitPrice.toFixed(2)} / {item.product?.unitOfMeasure}
                    </td>
                    <td className="p-4 font-bold text-sm text-slate-900">
                      {item.quantity} {item.product?.unitOfMeasure}
                    </td>
                    <td className="p-4 text-slate-500">
                      {item.lowStockThreshold}
                    </td>
                    <td className="p-4">
                      {item.isLowStock ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="h-3 w-3" />
                          <span>LOW STOCK</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="h-3 w-3" />
                          <span>HEALTHY</span>
                        </span>
                      )}
                    </td>
                    {canEditStock && (
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 text-xs font-bold transition-colors shadow-2xs"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Adjust Stock — {editItem.product?.name}</h3>
              <button onClick={() => setEditItem(null)} className="text-xs text-slate-400 hover:text-slate-600">
                Cancel
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                Branch: <span className="text-slate-900 font-bold">{editItem.branch?.name}</span>
              </div>

              {/* Stock Quantity Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">New Available Quantity</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setNewQuantity(Math.max(0, newQuantity - 1))}
                    className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-900 text-base focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setNewQuantity(newQuantity + 1)}
                    className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Low Stock Threshold Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Configurable Low Stock Alert Threshold</label>
                <input
                  type="number"
                  min="1"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={handleSaveInventory}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-2 shadow-xs"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Stock Levels'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
