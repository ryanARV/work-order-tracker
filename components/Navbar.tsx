'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface NavbarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-blue-700 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-bold">Work Order Tracker</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="text-xs sm:text-sm hidden sm:block">
              <div className="font-medium">{user.name}</div>
              <div className="text-blue-200 text-xs">{user.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      {/* Admin Navigation */}
      {user.role === 'ADMIN' && (
        <>
          {/* Desktop Navigation */}
          <div className="bg-blue-700 hidden md:block">
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
                  href="/parts"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Parts
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
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="bg-blue-700 md:hidden">
              <div className="px-4 py-2 space-y-1">
                <a
                  href="/work-orders"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Work Orders
                </a>
                <a
                  href="/work-orders/board"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Board
                </a>
                <a
                  href="/customers"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Customers
                </a>
                <a
                  href="/parts"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Parts
                </a>
                <a
                  href="/admin/exceptions"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Exceptions
                </a>
                <div className="pt-2 mt-2 border-t border-blue-600">
                  <div className="px-3 py-2 text-sm">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-blue-200 text-xs">{user.role}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Service Writer Navigation */}
      {user.role === 'SERVICE_WRITER' && (
        <>
          {/* Desktop Navigation */}
          <div className="bg-blue-700 hidden md:block">
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
                  href="/parts"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Parts
                </a>
              </div>
            </div>
          </div>
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="bg-blue-700 md:hidden">
              <div className="px-4 py-2 space-y-1">
                <a
                  href="/work-orders"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Work Orders
                </a>
                <a
                  href="/work-orders/board"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Board
                </a>
                <a
                  href="/customers"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Customers
                </a>
                <a
                  href="/parts"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Parts
                </a>
                <div className="pt-2 mt-2 border-t border-blue-600">
                  <div className="px-3 py-2 text-sm">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-blue-200 text-xs">{user.role}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Manager Navigation */}
      {user.role === 'MANAGER' && (
        <>
          {/* Desktop Navigation */}
          <div className="bg-blue-700 hidden md:block">
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
                  href="/parts"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Parts
                </a>
              </div>
            </div>
          </div>
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="bg-blue-700 md:hidden">
              <div className="px-4 py-2 space-y-1">
                <a
                  href="/work-orders"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Work Orders
                </a>
                <a
                  href="/work-orders/board"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Board
                </a>
                <a
                  href="/parts"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Parts
                </a>
                <div className="pt-2 mt-2 border-t border-blue-600">
                  <div className="px-3 py-2 text-sm">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-blue-200 text-xs">{user.role}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Parts Navigation */}
      {user.role === 'PARTS' && (
        <>
          {/* Desktop Navigation */}
          <div className="bg-blue-700 hidden md:block">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex space-x-4 py-2">
                <a
                  href="/parts"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Parts
                </a>
              </div>
            </div>
          </div>
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="bg-blue-700 md:hidden">
              <div className="px-4 py-2 space-y-1">
                <a
                  href="/parts"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Parts
                </a>
                <div className="pt-2 mt-2 border-t border-blue-600">
                  <div className="px-3 py-2 text-sm">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-blue-200 text-xs">{user.role}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tech Navigation */}
      {user.role === 'TECH' && (
        <>
          {/* Desktop Navigation */}
          <div className="bg-blue-700 hidden md:block">
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
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="bg-blue-700 md:hidden">
              <div className="px-4 py-2 space-y-1">
                <a
                  href="/my-work"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  My Work
                </a>
                <div className="pt-2 mt-2 border-t border-blue-600">
                  <div className="px-3 py-2 text-sm">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-blue-200 text-xs">{user.role}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </nav>
  );
}
