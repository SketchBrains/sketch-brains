import React, { useEffect, useState } from 'react';
import { Users, Calendar, DollarSign, Gift, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

export function Admin() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.is_admin) {
      loadStats();
    }
  }, [profile]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [usersRes, eventsRes, registrationsRes, revenueRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('registrations').select('id', { count: 'exact', head: true }),
        supabase
          .from('registrations')
          .select('amount_paid')
          .in('payment_status', ['completed', 'free']),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalEvents: eventsRes.count || 0,
        totalRegistrations: registrationsRes.count || 0,
        totalRevenue:
          revenueRes.data?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile?.is_admin) {
    return (
      <Layout>
        <Card className="p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access this page</p>
        </Card>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">Manage events, users, and platform settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600 opacity-80" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Events</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
              </div>
              <Calendar className="w-12 h-12 text-green-600 opacity-80" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Registrations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalRegistrations}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-600 opacity-80" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₹{stats.totalRevenue}</p>
              </div>
              <DollarSign className="w-12 h-12 text-orange-600 opacity-80" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a href="/admin/events">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <Calendar className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Events</h3>
              <p className="text-gray-600">Create, edit, and manage all platform events</p>
            </Card>
          </a>

          <a href="/admin/users">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <Users className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Users</h3>
              <p className="text-gray-600">View and manage user accounts and registrations</p>
            </Card>
          </a>

          <a href="/admin/coupons">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <Gift className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Coupons</h3>
              <p className="text-gray-600">Create and manage discount codes and offers</p>
            </Card>
          </a>

          <a href="/admin/materials">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <TrendingUp className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Materials</h3>
              <p className="text-gray-600">Upload course materials for events</p>
            </Card>
          </a>

          <a href="/admin/referrals">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <Users className="w-12 h-12 text-pink-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Referral Analytics</h3>
              <p className="text-gray-600">Track and manage referral program</p>
            </Card>
          </a>

          <a href="/admin/feedback">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <TrendingUp className="w-12 h-12 text-teal-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">View Feedback</h3>
              <p className="text-gray-600">Review event feedback and ratings</p>
            </Card>
          </a>
        </div>
      </div>
    </Layout>
  );
}
