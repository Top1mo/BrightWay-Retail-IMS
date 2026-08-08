'use client';

import React, { useState, useEffect } from 'react';
import { useRole } from '../layout';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Printer,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  Tag,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  unitOfMeasure: string;
  availableQty: number;
  quantity: number;
}

export default function POSPage() {
  const { branchId, branchName } = useRole();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Cash');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Receipt Modal State
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const fetchProductsAndInventory = async () => {
    try {
      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      if (catData.success) setCategories(catData.categories);

      const targetBranchId = branchId || 'downtown-id';
      const invRes = await fetch(`/api/inventory?branchId=${targetBranchId}`);
      const invData = await invRes.json();

      if (invData.success) {
        const activeItems = invData.inventory
          .filter((inv: any) => inv.product?.isActive)
          .map((inv: any) => ({
            id: inv.product.id,
            name: inv.product.name,
            categoryId: inv.product.categoryId,
            unitPrice: inv.product.unitPrice,
            unitOfMeasure: inv.product.unitOfMeasure,
            quantity: inv.quantity,
          }));
        setProducts(activeItems);
      }
    } catch (e) {
      console.error('Failed to load POS data:', e);
    }
  };

  useEffect(() => {
    fetchProductsAndInventory();
  }, [branchId]);

  const addToCart = (product: any) => {
    if (product.quantity <= 0) {
      setErrorMessage(`"${product.name}" is out of stock!`);
      return;
    }
    setErrorMessage('');

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          setErrorMessage(`Cannot add more "${product.name}". Max available stock reached (${product.quantity}).`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.unitPrice,
          unitOfMeasure: product.unitOfMeasure,
          availableQty: product.quantity,
          quantity: 1,
        },
      ];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.availableQty) {
              setErrorMessage(`Max available stock for "${item.name}" is ${item.availableQty}.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    setErrorMessage('');

    try {
      const targetBranchId = branchId || 'downtown-id';
      const cashierId = 'usr-cashier';

      const res = await fetch('/api/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: targetBranchId,
          cashierId,
          customerName: customerName.trim() || 'Walk-in Customer',
          customerPhone: customerPhone.trim() || null,
          discountAmount,
          paymentMethod,
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Transaction failed. Please try again.');
        setProcessing(false);
        return;
      }

      setCompletedSale(data.sale);
      setShowReceiptModal(true);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountAmount(0);

      await fetchProductsAndInventory();
    } catch (e: any) {
      setErrorMessage(e.message || 'An unexpected checkout error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-100px)] flex gap-6 overflow-hidden">
      {/* Left: Product Selection Grid */}
      <div className="flex-1 flex flex-col glass-panel p-5 rounded-2xl border border-slate-200 space-y-4 overflow-hidden shadow-xs">
        {/* Search Bar & Refresh */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            onClick={fetchProductsAndInventory}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-2xs transition-colors"
            title="Refresh Live Stock"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.quantity <= 0;
            return (
              <button
                key={product.id}
                disabled={isOutOfStock}
                onClick={() => addToCart(product)}
                className={`glass-card p-4 rounded-2xl border text-left flex flex-col justify-between transition-all group ${
                  isOutOfStock
                    ? 'opacity-40 cursor-not-allowed border-red-200 bg-red-50/20'
                    : 'border-slate-200 hover:border-indigo-400 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {product.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">
                    ${product.unitPrice.toFixed(2)} / {product.unitOfMeasure}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isOutOfStock
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : product.quantity <= 10
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isOutOfStock ? 'OUT OF STOCK' : `Stock: ${product.quantity}`}
                  </span>

                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Cart & High-Speed Checkout */}
      <div className="w-96 glass-panel p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4 shadow-xs">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">POS Checkout Cart</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold">
              {cart.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>

          {/* Cart Items List */}
          <div className="mt-3 max-h-56 overflow-y-auto space-y-2 pr-1">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Cart is empty. Click any product to add to sale.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.productId}
                  className="glass-card p-2.5 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex-1 pr-2">
                    <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      ${item.unitPrice.toFixed(2)} × {item.quantity} = ${(item.unitPrice * item.quantity).toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => updateCartQuantity(item.productId, -1)}
                      className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-bold w-6 text-center text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.productId, 1)}
                      className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 ml-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Customer & Discount Controls */}
        <div className="space-y-3 pt-3 border-t border-slate-200">
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Phone (Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Discount & Payment Method */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Tag className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Discount ($)"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  paymentMethod === 'Cash'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Banknote className="h-3 w-3" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('Card')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  paymentMethod === 'Card'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="h-3 w-3" />
                <span>Card</span>
              </button>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-200">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount Applied</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-1">
              <span>Grand Total</span>
              <span className="text-indigo-600">${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            disabled={cart.length === 0 || processing}
            onClick={handleCheckout}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
              cart.length === 0 || processing
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
            }`}
          >
            {processing ? (
              <span>Processing Atomic Sale...</span>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Complete Sale (${finalTotal.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Printable Thermal Receipt Modal */}
      {showReceiptModal && completedSale && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
                <h3 className="text-base font-bold">Transaction Completed!</h3>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            {/* Thermal Receipt Box */}
            <div id="printable-receipt" className="bg-slate-50 p-4 rounded-xl text-slate-900 text-xs font-mono border border-slate-200 space-y-3">
              <div className="text-center">
                <div className="font-bold text-sm text-slate-900">BRIGHTWAY RETAIL GROUP</div>
                <div className="text-[10px] text-slate-500">{completedSale.branch?.name}</div>
                <div className="text-[10px] text-slate-400">Receipt ID: #{completedSale.id.slice(0, 8)}</div>
                <div className="text-[10px] text-slate-400">{new Date(completedSale.createdAt).toLocaleString()}</div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                <div>Customer: {completedSale.customerName || 'Walk-in'}</div>
                {completedSale.customerPhone && <div>Phone: {completedSale.customerPhone}</div>}
                <div>Payment: {completedSale.paymentMethod}</div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                {completedSale.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.quantity}x {item.product?.name}</span>
                    <span>${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 font-bold">
                {completedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-${completedSale.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-900">
                  <span>TOTAL PAID:</span>
                  <span>${completedSale.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-300">
                Thank you for shopping at BrightWay!
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
