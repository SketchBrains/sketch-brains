import React, { useEffect, useState } from 'react';
import { Calendar, Award, Users, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Layout } from '../components/Layout';
import type { Database } from '../lib/database.types';

type Event = Database['public']['Tables']['events']['Row'];
type Registration = Database['public']['Tables']['registrations']['Row'] & {
  events: Event;
};

export function Dashboard() {
  const { user, profile } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: regsData, error: regsError } = await supabase
        .from('registrations')
        .select('*, events(*)')
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false });

      if (regsError) throw regsError;
      setRegistrations(regsData as any || []);

      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', user.id)
        .eq('status', 'completed');

      if (referralsError) throw referralsError;
      setReferralCount(referralsData?.length || 0);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const activeRegistrations = registrations.filter(
    (r) => ['pending', 'completed', 'free'].includes(r.payment_status) && r.events.status !== 'completed'
  );

  const completedRegistrations = registrations.filter((r) => r.events.status === 'completed');

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
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.full_name}!</h1>
          <p className="text-gray-600 mt-1">Here's your learning journey overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Events</p>
                <p className="text-3xl font-bold text-gray-900">{activeRegistrations.length}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-600 opacity-80" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{completedRegistrations.length}</p>
              </div>
              <Award className="w-12 h-12 text-green-600 opacity-80" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Referrals</p>
                <p className="text-3xl font-bold text-gray-900">{referralCount}</p>
              </div>
              <Users className="w-12 h-12 text-purple-600 opacity-80" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Your Code</p>
                <p className="text-xl font-bold text-gray-900">{profile?.referral_code}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-600 opacity-80" />
            </div>
          </Card>
        </div>

        {activeRegistrations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRegistrations.map((reg) => (
                <Card key={reg.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        reg.events.status === 'upcoming'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {reg.events.status.charAt(0).toUpperCase() + reg.events.status.slice(1)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        reg.payment_status === 'completed' || reg.payment_status === 'free'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {reg.payment_status === 'free' ? 'Free' : reg.payment_status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{reg.events.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Starts: {formatDate(reg.events.start_date)}
                  </p>
                  <a href={`/events/${reg.events.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                    View Details →
                  </a>
                </Card>
              ))}
            </div>
          </div>
        )}

        {completedRegistrations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Completed Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedRegistrations.map((reg) => (
                <Card key={reg.id} className="p-6 opacity-90">
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                      Completed
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{reg.events.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Completed: {formatDate(reg.events.end_date)}
                  </p>
                  <a href={`/materials?event=${reg.events.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                    View Materials →
                  </a>
                </Card>
              ))}
            </div>
          </div>
        )}

        {registrations.length === 0 && (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-6">Start your learning journey by registering for an event</p>
            <a href="/events" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Browse Events
            </a>
          </Card>
        )}

        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Referral Program</h3>
          <p className="text-gray-700 mb-4">
            Refer 2 friends to any Technical event and get that event for FREE!
          </p>
          <div className="bg-white rounded-lg p-4 border-2 border-dashed border-blue-300">
            <p className="text-sm text-gray-600 mb-2">Your referral code:</p>
            <p className="text-2xl font-bold text-blue-600">{profile?.referral_code}</p>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Share your code with friends when they sign up!
          </p>
        </Card>
      </div>
    </Layout>
  );
}
