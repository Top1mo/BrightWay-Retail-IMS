'use client';

import React, { useState, useEffect } from 'react';
import { useRole } from '../layout';
import {
  Truck,
  Plus,
  Building2,
  CheckCircle,
  Clock,
  UserCheck,
  Phone,
  Boxes,
} from 'lucide-react';

export default function PurchasingPage() {
  const { role } = useRole();
  const [activeTab, setActiveTab] = useState<'POS' | 'SUPPLIERS'>('POS');
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New PO Modal
  const [showPOModal, setShowPOModal] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [poItems, setPoItems] = useState<Array<{ productId: string; orderedQty: number; unitCost: number }>>([
    { productId: '', orderedQty: 50, unitCost: 2.0 },
  ]);
  const [submittingPO, setSubmittingPO] = useState(false);

  // New Supplier Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');

  // Goods Receiving Modal
  const [receivingPO, setReceivingPO] = useState<any | null>(null);
  const [receivedQtyMap, setReceivedQtyMap] = useState<Record<string, number>>({});
  const [receivingSubmit, setReceivingSubmit] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const poRes = await fetch('/api/purchase-orders');
      const poData = await poRes.json();
      if (poData.success) setPurchaseOrders(poData.purchaseOrders);

      const supRes = await fetch('/api/suppliers');
      const supData = await supRes.json();
      if (supData.success) setSuppliers(supData.suppliers);

      const bRes = await fetch('/api/branches');
      const bData = await bRes.json();
      if (bData.success) setBranches(bData.branches.filter((b: any) => b.name !== 'Head Office'));

      const pRes = await fetch('/api/products?activeOnly=true');
      const pData = await pRes.json();
      if (pData.success) setProducts(pData.products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPOItem = () => {
    setPoItems((prev) => [...prev, { productId: '', orderedQty: 50, unitCost: 2.0 }]);
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !branchId || poItems.some((i) => !i.productId || i.orderedQty <= 0)) return;

    setSubmittingPO(true);
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, branchId, items: poItems }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPOModal(false);
        setSupplierId('');
        setBranchId('');
        setPoItems([{ productId: '', orderedQty: 50, unitCost: 2.0 }]);
        await loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingPO(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactPerson || !phone) return;

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, contactPerson, phone }),
      });
      const data = await res.json();
      if (data.success) {
        setShowSupplierModal(false);
        setCompanyName('');
        setContactPerson('');
        setPhone('');
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openReceivingModal = (po: any) => {
    setReceivingPO(po);
    const initialMap: Record<string, number> = {};
    po.items.forEach((item: any) => {
      const remaining = Math.max(0, item.orderedQty - item.receivedQty);
      initialMap[item.id] = remaining;
    });
    setReceivedQtyMap(initialMap);
  };

  const handleConfirmReceipt = async () => {
    if (!receivingPO) return;
    setReceivingSubmit(true);

    try {
      const receivedItems = Object.entries(receivedQtyMap).map(([itemId, newlyReceivedQty]) => ({
        itemId,
        newlyReceivedQty,
      }));

      const res = await fetch('/api/purchase-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poId: receivingPO.id, receivedItems }),
      });
      const data = await res.json();
      if (data.success) {
        setReceivingPO(null);
        await loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReceivingSubmit(false);
    }
  };

  const canCreatePO = ['SYS_ADMIN', 'PURCHASING'].includes(role);
  const canReceiveGoods = ['SYS_ADMIN', 'PURCHASING', 'INVENTORY_STAFF', 'BRANCH_MANAGER'].includes(role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
            <Truck className="h-4 w-4 text-amber-600" />
            <span>Supplier Management & Receiving</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Purchase Orders & Suppliers</h2>
          <p className="text-sm text-slate-500 mt-1">
            Create vendor POs, record partial goods receipts, and automatically update local branch stock.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('POS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'POS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
            }`}
          >
            Purchase Orders
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'SUPPLIERS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
            }`}
          >
            Suppliers Directory
          </button>

          {canCreatePO && (
            <button
              onClick={() => (activeTab === 'POS' ? setShowPOModal(true) : setShowSupplierModal(true))}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>{activeTab === 'POS' ? 'Create Purchase Order' : 'Add New Supplier'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Purchase Orders */}
      {activeTab === 'POS' && (
        <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading purchase orders...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-4">PO Reference</th>
                    <th className="p-4">Supplier</th>
                    <th className="p-4">Delivery Branch</th>
                    <th className="p-4">Ordered SKUs</th>
                    <th className="p-4">Date Created</th>
                    <th className="p-4">Status</th>
                    {canReceiveGoods && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.map((po) => {
                    const isOpen = po.status === 'OPEN';
                    const isPartial = po.status === 'PARTIAL';
                    const isFulfilled = po.status === 'FULFILLED';

                    return (
                      <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono text-slate-400">#{po.id.slice(0, 8)}</td>
                        <td className="p-4 font-bold text-slate-900">{po.supplier?.companyName}</td>
                        <td className="p-4 text-slate-700 font-medium">{po.branch?.name}</td>
                        <td className="p-4 text-slate-600">
                          {po.items.map((i: any) => `${i.product?.name} (${i.receivedQty}/${i.orderedQty})`).join(', ')}
                        </td>
                        <td className="p-4 text-slate-500 text-[11px]">{new Date(po.createdAt).toLocaleString()}</td>
                        <td className="p-4">
                          {isOpen && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="h-3 w-3" /> OPEN
                            </span>
                          )}
                          {isPartial && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                              <Boxes className="h-3 w-3" /> PARTIAL
                            </span>
                          )}
                          {isFulfilled && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="h-3 w-3" /> FULFILLED
                            </span>
                          )}
                        </td>
                        {canReceiveGoods && (
                          <td className="p-4 text-right">
                            {!isFulfilled && (
                              <button
                                onClick={() => openReceivingModal(po)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs"
                              >
                                Record Received Goods
                              </button>
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
      )}

      {/* Tab 2: Supplier Directory */}
      {activeTab === 'SUPPLIERS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div key={s.id} className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{s.companyName}</h4>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <UserCheck className="h-3.5 w-3.5 text-amber-600" />
                    <span>Contact: {s.contactPerson}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{s.phone}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Receive Goods Modal */}
      {receivingPO && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Record Incoming Goods — PO #{receivingPO.id.slice(0, 8)}
              </h3>
              <button onClick={() => setReceivingPO(null)} className="text-xs text-slate-400 hover:text-slate-600">
                Cancel
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Receiving Branch: <span className="text-slate-900 font-bold">{receivingPO.branch?.name}</span>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {receivingPO.items.map((item: any) => {
                const remaining = Math.max(0, item.orderedQty - item.receivedQty);
                return (
                  <div key={item.id} className="glass-card p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-bold text-slate-900">{item.product?.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Ordered: {item.orderedQty} | Received: {item.receivedQty}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-600">Newly Delivered Qty:</span>
                      <input
                        type="number"
                        min="0"
                        max={remaining}
                        value={receivedQtyMap[item.id] || 0}
                        onChange={(e) =>
                          setReceivedQtyMap({
                            ...receivedQtyMap,
                            [item.id]: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-24 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setReceivingPO(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={receivingSubmit}
                onClick={handleConfirmReceipt}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
              >
                {receivingSubmit ? 'Updating Stock...' : 'Confirm Receipt & Increment Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePO}
            className="bg-white max-w-lg w-full p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Purchase Order</h3>
              <button
                type="button"
                onClick={() => setShowPOModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Vendor Supplier</label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Delivery Branch</label>
                <select
                  required
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Delivery Branch --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PO Line items */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Ordered Line Items</span>
                <button
                  type="button"
                  onClick={handleAddPOItem}
                  className="text-amber-600 hover:text-amber-700 font-semibold"
                >
                  + Add Item
                </button>
              </div>

              {poItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2">
                  <select
                    required
                    value={item.productId}
                    onChange={(e) => {
                      const updated = [...poItems];
                      updated[idx].productId = e.target.value;
                      setPoItems(updated);
                    }}
                    className="col-span-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  >
                    <option value="">Product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.orderedQty}
                    onChange={(e) => {
                      const updated = [...poItems];
                      updated[idx].orderedQty = parseInt(e.target.value) || 0;
                      setPoItems(updated);
                    }}
                    className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 text-center"
                  />

                  <input
                    type="number"
                    step="0.1"
                    placeholder="Cost ($)"
                    value={item.unitCost}
                    onChange={(e) => {
                      const updated = [...poItems];
                      updated[idx].unitCost = parseFloat(e.target.value) || 0;
                      setPoItems(updated);
                    }}
                    className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 text-center"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPOModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPO}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
              >
                {submittingPO ? 'Creating PO...' : 'Create Purchase Order'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSupplier}
            className="bg-white max-w-md w-full p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Vendor Supplier</h3>
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Consumer Goods Inc."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Contact Representative</label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Marcus Vance"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1-800-555-0199"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
              >
                Save Supplier
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
