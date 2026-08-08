'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Role, canAccessModule } from '@/lib/auth';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  ArrowRightLeft,
  PackageSearch,
  Truck,
  Users,
  FileBarChart2,
  Lock,
} from 'lucide-react';

interface SidebarProps {
  currentRole: Role;
}

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Point of Sale (POS)', href: '/pos', icon: ShoppingCart },
  { name: 'Branch Inventory', href: '/inventory', icon: Boxes },
  { name: 'Inter-Branch Transfers', href: '/transfers', icon: ArrowRightLeft },
  { name: 'Product Catalog', href: '/products', icon: PackageSearch },
  { name: 'Purchasing & POs', href: '/purchasing', icon: Truck },
  { name: 'Employees & Users', href: '/employees', icon: Users },
  { name: 'Executive & Reports', href: '/reports', icon: FileBarChart2 },
];

export default function Sidebar({ currentRole }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-61px)] p-4 flex flex-col justify-between shadow-2xs">
      <div className="space-y-6">
        <div>
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Navigation Core
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isAllowed = canAccessModule(currentRole, item.href);
              const isActive = pathname === item.href;
              const Icon = item.icon;

              if (!isAllowed) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 cursor-not-allowed opacity-50 select-none text-xs"
                    title={`Access restricted for ${currentRole}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span>{item.name}</span>
                    </div>
                    <Lock className="h-3 w-3 text-slate-400" />
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200/80 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
        <div className="font-semibold text-slate-700">System Status</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Real-time Sync Active</span>
        </div>
        <div className="text-[10px] text-slate-400">Prisma Atomic Transactions On</div>
      </div>
    </aside>
  );
}
