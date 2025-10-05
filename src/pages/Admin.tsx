import React, { useEffect, useState } from 'react';
import { Users, Calendar, DollarSign, Gift, TrendingUp, Mail, BarChart3, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { Chart } from '../components/Chart';

export function Admin() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
    userGrowth: 0,
    revenueGrowth: 0,
    conversionRate: 0,
    avgEventRevenue: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [eventData, setEventData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.is_admin) {
      loadStats();
    }
  }, [profile]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const [usersRes, eventsRes, registrationsRes, revenueRes, recentUsersRes, recentRevenueRes, registrationsWithEvents] = await Promise.all([
        supabase.from('profiles').select('id, created_at', { count: 'exact' }),
        supabase.from('events').select('id, title, category', { count: 'exact' }),
        supabase.from('registrations').select('id', { count: 'exact', head: true }),
        supabase
          .from('registrations')
          .select('amount_paid, created_at')
          .in('payment_status', ['completed']),
        supabase
          .from('profiles')
          .select('id')
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('registrations')
          .select('amount_paid')
          .in('payment_status', ['completed'])
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('registrations')
          .select('amount_paid, event_id, events(title, category)')
          .in('payment_status', ['completed']),
      ]);

      const totalRevenue = revenueRes.data?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0;
      const recentRevenue = recentRevenueRes.data?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0;
      const totalUsers = usersRes.count || 0;
      const recentUsers = recentUsersRes.data?.length || 0;
      const totalEvents = eventsRes.count || 0;

      const oldUsersRes = await supabase
        .from('profiles')
        .select('id')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());
      const oldUsers = oldUsersRes.data?.length || 0;

      const oldRevenueRes = await supabase
        .from('registrations')
        .select('amount_paid')
        .in('payment_status', ['completed'])
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());
      const oldRevenue = oldRevenueRes.data?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0;

      const userGrowth = oldUsers > 0 ? ((recentUsers - oldUsers) / oldUsers) * 100 : 100;
      const revenueGrowth = oldRevenue > 0 ? ((recentRevenue - oldRevenue) / oldRevenue) * 100 : 100;
      const conversionRate = totalUsers > 0 ? ((registrationsRes.count || 0) / totalUsers) * 100 : 0;
      const avgEventRevenue = totalEvents > 0 ? totalRevenue / totalEvents : 0;

      setStats({
        totalUsers,
        totalEvents,
        totalRegistrations: registrationsRes.count || 0,
        totalRevenue,
        userGrowth,
        revenueGrowth,
        conversionRate,
        avgEventRevenue,
      });

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const revenueByDay = last7Days.map(date => {
        const dayRevenue = revenueRes.data
          ?.filter(r => r.created_at.startsWith(date))
          .reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0;
        return {
          label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          value: dayRevenue,
        };
      });
      setRevenueData(revenueByDay);

      const eventStats = registrationsWithEvents.data?.reduce((acc: any, reg: any) => {
        const eventTitle = reg.events?.title || 'Other';
        if (!acc[eventTitle]) {
          acc[eventTitle] = 0;
        }
        acc[eventTitle] += reg.amount_paid || 0;
        return acc;
      }, {});

      const topEvents = Object.entries(eventStats || {})
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([title, revenue]) => ({
          label: title as string,
          value: revenue as number,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        }));
      setEventData(topEvents);

      const categoryStats = eventsRes.data?.reduce((acc: any, event: any) => {
        const category = event.category || 'Other';
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category]++;
        return acc;
      }, {});

      const categoryChart = Object.entries(categoryStats || {}).map(([category, count]) => ({
        label: category as string,
        value: count as number,
        color: category === 'technical' ? '#3b82f6' : category === 'design' ? '#10b981' : '#f59e0b',
      }));
      setCategoryData(categoryChart);
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
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm text-blue-700 mb-1 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalUsers}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600 opacity-80" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              stats.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.userGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(stats.userGrowth).toFixed(1)}% vs last month
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm text-emerald-700 mb-1 font-medium">Total Events</p>
                <p className="text-3xl font-bold text-emerald-900">{stats.totalEvents}</p>
              </div>
              <Calendar className="w-12 h-12 text-emerald-600 opacity-80" />
            </div>
            <div className="text-sm text-emerald-700 font-medium">
              ₹{stats.avgEventRevenue.toFixed(0)} avg revenue
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm text-teal-700 mb-1 font-medium">Registrations</p>
                <p className="text-3xl font-bold text-teal-900">{stats.totalRegistrations}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-teal-600 opacity-80" />
            </div>
            <div className="text-sm text-teal-700 font-medium">
              {stats.conversionRate.toFixed(1)}% conversion rate
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm text-amber-700 mb-1 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-amber-900">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-12 h-12 text-amber-600 opacity-80" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.revenueGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(stats.revenueGrowth).toFixed(1)}% vs last month
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Chart data={revenueData} type="line" title="Revenue Trend (Last 7 Days)" height={250} />
          </Card>

          <Card className="p-6">
            <Chart data={eventData} type="bar" title="Top Performing Events" height={250} />
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <Chart data={categoryData} type="donut" title="Events by Category" height={200} />
          </Card>

          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <a href="/admin/notifications">
                <div className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                  <Mail className="w-8 h-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Send Emails</h4>
                  <p className="text-sm text-gray-600">Notify participants</p>
                </div>
              </a>
              <a href="/admin/events">
                <div className="p-4 border-2 border-emerald-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer">
                  <Calendar className="w-8 h-8 text-emerald-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Create Event</h4>
                  <p className="text-sm text-gray-600">Add new workshop</p>
                </div>
              </a>
              <a href="/admin/users">
                <div className="p-4 border-2 border-teal-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-all cursor-pointer">
                  <Users className="w-8 h-8 text-teal-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">View Users</h4>
                  <p className="text-sm text-gray-600">Manage accounts</p>
                </div>
              </a>
              <a href="/admin/feedback">
                <div className="p-4 border-2 border-amber-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all cursor-pointer">
                  <BarChart3 className="w-8 h-8 text-amber-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Analytics</h4>
                  <p className="text-sm text-gray-600">View insights</p>
                </div>
              </a>
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
              <Gift className="w-12 h-12 text-rose-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Coupons</h3>
              <p className="text-gray-600">Create and manage discount codes and offers</p>
            </Card>
          </a>

          <a href="/admin/notifications">
            <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-blue-300">
              <Mail className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Notification Center</h3>
              <p className="text-gray-600">Send targeted emails and campaigns</p>
            </Card>
          </a>

          <a href="/admin/materials">
            <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-orange-300">
              <Activity className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Materials</h3>
              <p className="text-gray-600">Upload course materials for events</p>
            </Card>
          </a>

          <a href="/admin/referrals">
            <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-cyan-300">
              <Users className="w-12 h-12 text-cyan-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Referral Analytics</h3>
              <p className="text-gray-600">Track and manage referral program</p>
            </Card>
          </a>

          <a href="/admin/feedback">
            <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-teal-300">
              <BarChart3 className="w-12 h-12 text-teal-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">View Feedback</h3>
              <p className="text-gray-600">Review event feedback and ratings</p>
            </Card>
          </a>
        </div>
      </div>
    </Layout>
  );
}
