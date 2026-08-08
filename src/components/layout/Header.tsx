'use client';

import React, { useState } from 'react';
import { Role } from '@/lib/auth';
import {
  ShieldCheck,
  Building2,
  UserCheck,
  ChevronDown,
  Sparkles,
  ShoppingBag,
  ArrowRightLeft,
  DollarSign,
  Boxes,
  Truck,
} from 'lucide-react';

interface HeaderProps {
  currentRole: Role;
  onRoleChange: (newRole: Role) => void;
  activeBranchName?: string;
}

const ROLE_METADATA: Record<
  Role,
  { label: string; bg: string; border: string; text: string; icon: any; description: string }
> = {
  SYS_ADMIN: {
    label: 'System Admin',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    icon: ShieldCheck,
    description: 'Full Access (HQ & All Branches)',
  },
  OPS_DIRECTOR: {
    label: 'Operations Director',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: Building2,
    description: 'Read-only Oversight Company-wide',
  },
  PURCHASING: {
    label: 'Purchasing Staff',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: Truck,
    description: 'Suppliers & Purchase Orders',
  },
  BRANCH_MANAGER: {
    label: 'Branch Manager',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: Boxes,
    description: 'Downtown Flagship Inventory & Transfers',
  },
  INVENTORY_STAFF: {
    label: 'Inventory Staff',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    icon: ArrowRightLeft,
    description: 'Branch Stock & Incoming Goods',
  },
  CASHIER: {
    label: 'Cashier / POS',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    icon: ShoppingBag,
    description: 'High-speed Sales & Receipts',
  },
  FINANCE: {
    label: 'Finance',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    icon: DollarSign,
    description: 'Sales Revenue & Purchase Audit',
  },
};

export default function Header({ currentRole, onRoleChange, activeBranchName }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const currentMeta = ROLE_METADATA[currentRole];
  const Icon = currentMeta.icon;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
      {/* Brand Title */}
      <div className="flex items-center space-x-3.5">
        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              BrightWay Retail
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full">
              V1 System
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
            <Building2 className="h-3.5 w-3.5 text-indigo-500" />
            <span>{activeBranchName || 'Head Office & 6 Branches'}</span>
          </p>
        </div>
      </div>

      {/* Role Switcher Dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`flex items-center space-x-3 px-3.5 py-2 rounded-xl border transition-all ${currentMeta.bg} ${currentMeta.border} hover:border-slate-300 focus:outline-none shadow-2xs`}
        >
          <div className={`p-1.5 rounded-lg ${currentMeta.bg} ${currentMeta.text}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
              <span>Active Role</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className={`text-xs font-bold ${currentMeta.text}`}>
              {currentMeta.label}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-500 flex items-center justify-between">
              <span>Switch Persona (7 Roles)</span>
              <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <div className="py-1 space-y-1 max-h-96 overflow-y-auto">
              {(Object.keys(ROLE_METADATA) as Role[]).map((roleKey) => {
                const meta = ROLE_METADATA[roleKey];
                const ItemIcon = meta.icon;
                const isSelected = roleKey === currentRole;

                return (
                  <button
                    key={roleKey}
                    onClick={() => {
                      onRoleChange(roleKey);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start space-x-3 transition-colors ${
                      isSelected
                        ? 'bg-slate-100 border border-slate-200 text-slate-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mt-0.5 ${meta.bg} ${meta.text}`}>
                      <ItemIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                        <span>{meta.label}</span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-200 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {meta.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
