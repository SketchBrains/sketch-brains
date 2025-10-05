import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, Award, ArrowLeft, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useToast } from '../components/Toast';

interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  event_id: string;
  registration_id: string;
  status: 'pending' | 'completed' | 'rewarded';
  created_at: string;
}

interface ReferralWithDetails extends Referral {
  referrer_name: string;
  referee_name: string;
  event_title: string;
}

interface ReferrerStats {
  referrer_id: string;
  referrer_name: string;
  referrer_email: string;
  total_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
  rewarded_referrals: number;
}

export function AdminReferrals() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [referrals, setReferrals] = useState<ReferralWithDetails[]>([]);
  const [topReferrers, setTopReferrers] = useState<ReferrerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
  });

  useEffect(() => {
    if (profile?.is_admin) {
      loadReferrals();
      loadTopReferrers();
    }
  }, [profile]);

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      const [profilesRes, eventsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name'),
        supabase.from('events').select('id, title'),
      ]);

      const referralsWithDetails = (referralsData || []).map((referral) => {
        const referrer = profilesRes.data?.find((p) => p.id === referral.referrer_id);
        const referee = profilesRes.data?.find((p) => p.id === referral.referee_id);
        const event = eventsRes.data?.find((e) => e.id === referral.event_id);

        return {
          ...referral,
          referrer_name: referrer?.full_name || 'Unknown',
          referee_name: referee?.full_name || 'Unknown',
          event_title: event?.title || 'Unknown Event',
        };
      });

      setReferrals(referralsWithDetails);

      setStats({
        totalReferrals: referralsData?.length || 0,
        completedReferrals: referralsData?.filter((r) => r.status === 'completed' || r.status === 'rewarded').length || 0,
        pendingReferrals: referralsData?.filter((r) => r.status === 'pending').length || 0,
      });
    } catch (error) {
      console.error('Error loading referrals:', error);
      showToast('Failed to load referrals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTopReferrers = async () => {
    try {
      const { data: referralsData, error: referralsError } = await supabase.from('referrals').select('*');

      if (referralsError) throw referralsError;

      const referrerMap = new Map<string, ReferrerStats>();

      for (const referral of referralsData || []) {
        if (!referrerMap.has(referral.referrer_id)) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', referral.referrer_id)
            .maybeSingle();

          referrerMap.set(referral.referrer_id, {
            referrer_id: referral.referrer_id,
            referrer_name: profileData?.full_name || 'Unknown',
            referrer_email: profileData?.email || 'Unknown',
            total_referrals: 0,
            completed_referrals: 0,
            pending_referrals: 0,
            rewarded_referrals: 0,
          });
        }

        const stats = referrerMap.get(referral.referrer_id)!;
        stats.total_referrals++;

        if (referral.status === 'completed') stats.completed_referrals++;
        if (referral.status === 'pending') stats.pending_referrals++;
        if (referral.status === 'rewarded') stats.rewarded_referrals++;
      }

      const sortedReferrers = Array.from(referrerMap.values()).sort(
        (a, b) => b.total_referrals - a.total_referrals
      );

      setTopReferrers(sortedReferrers.slice(0, 10));
    } catch (error) {
      console.error('Error loading top referrers:', error);
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <a href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </a>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Referral Analytics</h1>
            <p className="text-gray-600 mt-1">Track and manage the referral program</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalReferrals}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600 opacity-80" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completedReferrals}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600 opacity-80" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingReferrals}</p>
              </div>
              <Award className="w-12 h-12 text-orange-600 opacity-80" />
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Award className="w-6 h-6 text-blue-600" />
            <span>Top Referrers</span>
          </h2>
          {topReferrers.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No referrers yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Completed</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Pending</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Rewarded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topReferrers.map((referrer, index) => (
                    <tr key={referrer.referrer_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">#{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{referrer.referrer_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{referrer.referrer_email}</td>
                      <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">
                        {referrer.total_referrals}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-green-600">
                        {referrer.completed_referrals}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-orange-600">
                        {referrer.pending_referrals}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-blue-600">
                        {referrer.rewarded_referrals}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Users className="w-6 h-6 text-blue-600" />
              <span>Recent Referrals</span>
            </h2>
            {referrals.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No referrals yet</p>
            ) : (
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              referral.status === 'completed' || referral.status === 'rewarded'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {referral.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="font-semibold text-gray-700">Referrer:</span>{' '}
                            <span className="text-gray-600">{referral.referrer_name}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Referee:</span>{' '}
                            <span className="text-gray-600">{referral.referee_name}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Event:</span>{' '}
                            <span className="text-gray-600">{referral.event_title}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mt-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(referral.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </Layout>
  );
}
