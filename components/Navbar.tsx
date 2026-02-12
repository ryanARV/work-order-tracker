'use client';

import { useRouter } from 'next/navigation';

interface NavbarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Work Order Tracker</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <div className="font-medium">{user.name}</div>
              <div className="text-blue-200 text-xs">{user.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      {/* Admin Navigation */}
      {user.role === 'ADMIN' && (
        <div className="bg-blue-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-4 py-2">
              <a
                href="/work-orders"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Work Orders
              </a>
              <a
                href="/work-orders/board"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Board
              </a>
              <a
                href="/customers"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Customers
              </a>
              <a
                href="/admin/exceptions"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Exceptions
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Service Writer Navigation */}
      {user.role === 'SERVICE_WRITER' && (
        <div className="bg-blue-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-4 py-2">
              <a
                href="/work-orders"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Work Orders
              </a>
              <a
                href="/work-orders/board"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Board
              </a>
              <a
                href="/customers"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Customers
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Manager Navigation */}
      {user.role === 'MANAGER' && (
        <div className="bg-blue-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-4 py-2">
              <a
                href="/work-orders"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Work Orders
              </a>
              <a
                href="/work-orders/board"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Board
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tech Navigation */}
      {user.role === 'TECH' && (
        <div className="bg-blue-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-4 py-2">
              <a
                href="/my-work"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                My Work
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
