import { Role, UserSession } from './types';
export type { Role };


// Pre-seeded role accounts for 1-click Demo Switching
export const DEMO_USERS: Record<Role, UserSession> = {
  SYS_ADMIN: {
    id: 'usr-admin',
    name: 'Alice Morgan',
    email: 'admin@brightway.com',
    role: 'SYS_ADMIN',
    branchId: null,
    branch: { id: 'head-office', name: 'Head Office', location: 'Corporate Center HQ' },
  },
  OPS_DIRECTOR: {
    id: 'usr-director',
    name: 'David Sterling',
    email: 'director@brightway.com',
    role: 'OPS_DIRECTOR',
    branchId: null,
    branch: { id: 'head-office', name: 'Head Office', location: 'Corporate Center HQ' },
  },
  PURCHASING: {
    id: 'usr-purchasing',
    name: 'Pamela Vance',
    email: 'purchasing@brightway.com',
    role: 'PURCHASING',
    branchId: null,
    branch: { id: 'head-office', name: 'Head Office', location: 'Corporate Center HQ' },
  },
  BRANCH_MANAGER: {
    id: 'usr-manager',
    name: 'Mark Gable',
    email: 'manager.downtown@brightway.com',
    role: 'BRANCH_MANAGER',
    branchId: 'downtown-id', // dynamic lookup in API
    branch: { id: 'downtown-id', name: 'Downtown Flagship', location: '101 Main St' },
  },
  INVENTORY_STAFF: {
    id: 'usr-inventory',
    name: 'Ian Wright',
    email: 'inventory.downtown@brightway.com',
    role: 'INVENTORY_STAFF',
    branchId: 'downtown-id',
    branch: { id: 'downtown-id', name: 'Downtown Flagship', location: '101 Main St' },
  },
  CASHIER: {
    id: 'usr-cashier',
    name: 'Chloe Adams',
    email: 'cashier.downtown@brightway.com',
    role: 'CASHIER',
    branchId: 'downtown-id',
    branch: { id: 'downtown-id', name: 'Downtown Flagship', location: '101 Main St' },
  },
  FINANCE: {
    id: 'usr-finance',
    name: 'Fiona Gallagher',
    email: 'finance@brightway.com',
    role: 'FINANCE',
    branchId: null,
    branch: { id: 'head-office', name: 'Head Office', location: 'Corporate Center HQ' },
  },
};

// Check module accessibility by role
export function canAccessModule(role: Role, modulePath: string): boolean {
  switch (role) {
    case 'SYS_ADMIN':
      return true; // Admin accesses all modules
    case 'OPS_DIRECTOR':
      return ['/dashboard', '/inventory', '/transfers', '/purchasing', '/reports'].includes(modulePath);
    case 'PURCHASING':
      return ['/dashboard', '/products', '/purchasing'].includes(modulePath);
    case 'BRANCH_MANAGER':
      return ['/dashboard', '/pos', '/inventory', '/transfers', '/reports'].includes(modulePath);
    case 'INVENTORY_STAFF':
      return ['/dashboard', '/inventory', '/transfers', '/purchasing'].includes(modulePath);
    case 'CASHIER':
      return ['/dashboard', '/pos'].includes(modulePath);
    case 'FINANCE':
      return ['/dashboard', '/purchasing', '/reports'].includes(modulePath);
    default:
      return false;
  }
}
