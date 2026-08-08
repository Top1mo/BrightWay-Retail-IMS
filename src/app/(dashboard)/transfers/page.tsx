'use client';

import React, { useState, useEffect } from 'react';
import { useRole } from '../layout';
import {
  ArrowRightLeft,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function TransfersPage() {
  const { role } = useRole();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Transfer Form State
  const [showNewModal, setShowNewModal] = useState(false);
  const [sendingBranchId, setSendingBranchId] = useState('');
  const [receivingBranchId, setReceivingBranchId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const transRes = await fetch('/api/transfers');
      const transData = await transRes.json();
      if (transData.success) setTransfers(transData.transfers);

      const branchRes = await fetch('/api/branches');
      const branchData = await branchRes.json();
      if (branchData.success) setBranches(branchData.branches);

      const prodRes = await fetch('/api/products?activeOnly=true');
      const prodData = await prodRes.json();
      if (prodData.success) setProducts(prodData.products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!sendingBranchId || !receivingBranchId || !selectedProductId || quantity <= 0) {
      setModalError('Please fill in all fields correctly.');
      return;
    }
    if (sendingBranchId === receivingBranchId) {
      setModalError('Sending branch and receiving branch cannot be the same!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendingBranchId,
          receivingBranchId,
          productId: selectedProductId,
          quantity,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setModalError(data.error || 'Failed to initiate transfer');
        setSubmitting(false);
        return;
      }

      setShowNewModal(false);
      setSendingBranchId('');
      setReceivingBranchId('');
      setSelectedProductId('');
      setQuantity(10);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, action: 'COMPLETE' | 'CANCEL') => {
    setActionProcessingId(id);
    try {
      const res = await fetch('/api/transfers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(`Transfer Error: ${data.error}`);
        return;
      }
      await loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionProcessingId(null);
    }
  };

  const canInitiateOrApprove = ['SYS_ADMIN', 'BRANCH_MANAGER', 'INVENTORY_STAFF'].includes(role);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
            <span>2-Step Inter-Branch Stock Transfers</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Transfer Operations</h2>
          <p className="text-sm text-slate-500 mt-1">
            Accountable inter-branch transfers with atomic database transactions upon approval.
          </p>
        </div>

        {canInitiateOrApprove && (
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Initiate Stock Transfer</span>
          </button>
        )}
      </div>

      {/* Transfers Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading transfers log...</div>
        ) : transfers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No stock transfers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-4">Transfer ID</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Sending Branch</th>
                  <th className="p-4">Receiving Branch</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Date Created</th>
                  <th className="p-4">Lifecycle Status</th>
                  {canInitiateOrApprove && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((t) => {
                  const isPending = t.status === 'PENDING';
                  const isCompleted = t.status === 'COMPLETED';
                  const isCancelled = t.status === 'CANCELLED';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono text-slate-400 text-[11px]">
                        #{t.id.slice(0, 8)}
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {t.product?.name}
                      </td>
                      <td className="p-4 text-slate-700 font-medium">
                        {t.sendingBranch?.name}
                      </td>
                      <td className="p-4 text-slate-700 font-medium">
                        {t.receivingBranch?.name}
                      </td>
                      <td className="p-4 font-bold text-indigo-600">
                        {t.quantity} {t.product?.unitOfMeasure}
                      </td>
                      <td className="p-4 text-slate-500 text-[11px]">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                            <Clock className="h-3 w-3" />
                            <span>PENDING</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="h-3 w-3" />
                            <span>COMPLETED</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="h-3 w-3" />
                            <span>CANCELLED</span>
                          </span>
                        )}
                      </td>
                      {canInitiateOrApprove && (
                        <td className="p-4 text-right space-x-2">
                          {isPending && (
                            <>
                              <button
                                disabled={actionProcessingId === t.id}
                                onClick={() => handleUpdateStatus(t.id, 'COMPLETE')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs"
                              >
                                Approve & Receive
                              </button>
                              <button
                                disabled={actionProcessingId === t.id}
                                onClick={() => handleUpdateStatus(t.id, 'CANCEL')}
                                className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Initiate Transfer Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTransfer}
            className="bg-white max-w-md w-full p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span>Initiate Inter-Branch Transfer</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Product Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Select Product SKU</label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Choose Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.unitPrice.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Sending Branch */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Sending Branch (Source Stock)</label>
              <select
                required
                value={sendingBranchId}
                onChange={(e) => setSendingBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Select Source Branch --</option>
                {branches
                  .filter((b) => b.name !== 'Head Office')
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Receiving Branch */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Receiving Branch (Target Stock)</label>
              <select
                required
                value={receivingBranchId}
                onChange={(e) => setReceivingBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Select Target Branch --</option>
                {branches
                  .filter((b) => b.name !== 'Head Office' && b.id !== sendingBranchId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Transfer Quantity */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Transfer Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
              >
                {submitting ? 'Initiating Request...' : 'Initiate PENDING Transfer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
