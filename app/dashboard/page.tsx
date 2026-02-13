'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TechDashboard from '@/components/dashboard/TechDashboard';
import ServiceWriterDashboard from '@/components/dashboard/ServiceWriterDashboard';
import PartsDashboard from '@/components/dashboard/PartsDashboard';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TECH' | 'SERVICE_WRITER' | 'PARTS' | 'MANAGER';
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, dashboardRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/dashboard'),
      ]);

      if (!userRes.ok || !dashboardRes.ok) {
        router.push('/login');
        return;
      }

      const [userData, dashData] = await Promise.all([
        userRes.json(),
        dashboardRes.json(),
      ]);

      setUser(userData.user);
      setDashboardData(dashData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !dashboardData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Welcome back, {user.name}
          </p>
        </div>

        {/* Role-Specific Dashboard */}
        {user.role === 'TECH' && <TechDashboard data={dashboardData} />}
        {user.role === 'SERVICE_WRITER' && <ServiceWriterDashboard data={dashboardData} />}
        {user.role === 'PARTS' && <PartsDashboard data={dashboardData} />}
        {user.role === 'MANAGER' && <ManagerDashboard data={dashboardData} />}
        {user.role === 'ADMIN' && <AdminDashboard data={dashboardData} />}
      </div>
    </div>
  );
}
