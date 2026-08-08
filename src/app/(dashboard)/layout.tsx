'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Role } from '@/lib/auth';

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  branchId: string | null;
  branchName: string;
}

const RoleContext = createContext<RoleContextType>({
  role: 'SYS_ADMIN',
  setRole: () => {},
  branchId: null,
  branchName: 'Head Office',
});

export const useRole = () => useContext(RoleContext);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('SYS_ADMIN');
  const [branchId, setBranchId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string>('Head Office & All Branches');

  // Load branch info based on role
  useEffect(() => {
    async function fetchBranchForRole() {
      if (['BRANCH_MANAGER', 'INVENTORY_STAFF', 'CASHIER'].includes(role)) {
        try {
          const res = await fetch('/api/branches');
          const data = await res.json();
          if (data.success && data.branches.length > 0) {
            const downtown = data.branches.find((b: any) => b.name.includes('Downtown')) || data.branches[0];
            setBranchId(downtown.id);
            setBranchName(downtown.name);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      setBranchId(null);
      setBranchName('Head Office & All 6 Branches');
    }
    fetchBranchForRole();
  }, [role]);

  return (
    <RoleContext.Provider value={{ role, setRole, branchId, branchName }}>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Header currentRole={role} onRoleChange={setRole} activeBranchName={branchName} />
        <div className="flex flex-1">
          <Sidebar currentRole={role} />
          <main className="flex-1 p-6 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </RoleContext.Provider>
  );
}
