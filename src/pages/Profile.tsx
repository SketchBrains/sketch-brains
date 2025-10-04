import React, { useState } from 'react';
import { User, Mail, Phone, Building, Share2, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

export function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    college: profile?.college || '',
  });

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          college: formData.college,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      alert('Referral code copied to clipboard!');
    }
  };

  if (!profile) {
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
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account information</p>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-500" />
              {editing ? (
                <Input
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Full Name"
                  className="flex-1"
                />
              ) : (
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="text-gray-900 font-medium">{profile.full_name}</p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-gray-900 font-medium">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-500" />
              {editing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Phone Number"
                  className="flex-1"
                />
              ) : (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-gray-900 font-medium">
                    {profile.phone || 'Not provided'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Building className="w-5 h-5 text-gray-500" />
              {editing ? (
                <Input
                  value={formData.college}
                  onChange={(e) =>
                    setFormData({ ...formData, college: e.target.value })
                  }
                  placeholder="College/Institution"
                  className="flex-1"
                />
              ) : (
                <div>
                  <p className="text-sm text-gray-600">College/Institution</p>
                  <p className="text-gray-900 font-medium">
                    {profile.college || 'Not provided'}
                  </p>
                </div>
              )}
            </div>

            {editing && (
              <div className="flex space-x-3 pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      full_name: profile.full_name,
                      phone: profile.phone || '',
                      college: profile.college || '',
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Your Referral Code</h2>
              <p className="text-gray-700 mb-4">
                Share this code with friends when they sign up. Refer 2 friends to any Technical
                event and get that event for FREE!
              </p>
              <div className="bg-white rounded-lg p-4 border-2 border-dashed border-blue-300 inline-block">
                <p className="text-3xl font-bold text-blue-600">{profile.referral_code}</p>
              </div>
            </div>
            <Button variant="outline" onClick={copyReferralCode}>
              <Share2 className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
        </Card>

        {profile.is_admin && (
          <Card className="p-6 bg-blue-50 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-blue-900 mb-2">Admin Access</h2>
            <p className="text-blue-800 mb-4">
              You have administrator privileges on this platform
            </p>
            <a href="/admin">
              <Button>Go to Admin Panel</Button>
            </a>
          </Card>
        )}
      </div>
    </Layout>
  );
}
