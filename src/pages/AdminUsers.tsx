import React, { useEffect, useState } from 'react';
import { Users, Search, Calendar, Mail, Phone, GraduationCap, ArrowLeft, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useToast } from '../components/Toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  college: string | null;
  referral_code: string;
  referred_by: string | null;
  is_admin: boolean;
  created_at: string;
}

interface UserWithStats extends UserProfile {
  registration_count: number;
  total_spent: number;
  referral_count: number;
}

export function AdminUsers() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile?.is_admin) {
      loadUsers();
    }
  }, [profile]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.college?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const usersWithStats = await Promise.all(
        (profilesData || []).map(async (user) => {
          const [registrationsRes, referralsRes] = await Promise.all([
            supabase
              .from('registrations')
              .select('amount_paid')
              .eq('user_id', user.id)
              .in('payment_status', ['completed', 'free']),
            supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id),
          ]);

          return {
            ...user,
            registration_count: registrationsRes.data?.length || 0,
            total_spent: registrationsRes.data?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0,
            referral_count: referralsRes.count || 0,
          };
        })
      );

      setUsers(usersWithStats);
      setFilteredUsers(usersWithStats);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Failed to load users', 'error');
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </a>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
              <p className="text-gray-600 mt-1">View and manage user accounts</p>
            </div>
          </div>
        </div>

        <Card className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, or college..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredUsers.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No Users Found' : 'No Users Yet'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Users will appear here once they register'}
                </p>
              </Card>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{user.full_name}</h3>
                        {user.is_admin && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {user.college && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <GraduationCap className="w-4 h-4" />
                            <span>{user.college}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{user.registration_count}</p>
                          <p className="text-xs text-gray-600">Events Registered</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">₹{user.total_spent}</p>
                          <p className="text-xs text-gray-600">Total Spent</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{user.referral_count}</p>
                          <p className="text-xs text-gray-600">Referrals Made</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Referral Code:</span> {user.referral_code}
                        </p>
                        {user.referred_by && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-semibold">Referred By:</span> {user.referred_by}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Total Users</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{filteredUsers.length}</span>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
