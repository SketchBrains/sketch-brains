import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Gift, ArrowLeft, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from: string;
  valid_until: string;
  applicable_events: string[] | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
}

export function AdminCoupons() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    valid_from: '',
    valid_until: '',
    applicable_events: [] as string[],
    max_uses: '',
    is_active: true,
  });

  useEffect(() => {
    if (profile?.is_admin) {
      loadCoupons();
      loadEvents();
    }
  }, [profile]);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
      showToast('Failed to load coupons', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase.from('events').select('id, title').order('title');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        valid_from: coupon.valid_from.split('T')[0],
        valid_until: coupon.valid_until.split('T')[0],
        applicable_events: coupon.applicable_events || [],
        max_uses: coupon.max_uses?.toString() || '',
        is_active: coupon.is_active,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: 0,
        valid_from: '',
        valid_until: '',
        applicable_events: [],
        max_uses: '',
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
        applicable_events: formData.applicable_events.length > 0 ? formData.applicable_events : null,
        max_uses: formData.max_uses ? Number(formData.max_uses) : null,
        is_active: formData.is_active,
      };

      if (editingCoupon) {
        const { error } = await supabase.from('coupons').update(couponData).eq('id', editingCoupon.id);

        if (error) throw error;
        showToast('Coupon updated successfully', 'success');
      } else {
        const { error } = await supabase.from('coupons').insert([couponData]);

        if (error) throw error;
        showToast('Coupon created successfully', 'success');
      }

      handleCloseModal();
      loadCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      showToast('Failed to save coupon', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);

      if (error) throw error;
      showToast('Coupon deleted successfully', 'success');
      loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      showToast('Failed to delete coupon', 'error');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('coupons').update({ is_active: !currentStatus }).eq('id', id);

      if (error) throw error;
      showToast(`Coupon ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
      loadCoupons();
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      showToast('Failed to update coupon status', 'error');
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
              <h1 className="text-3xl font-bold text-gray-900">Manage Coupons</h1>
              <p className="text-gray-600 mt-1">Create and manage discount codes</p>
            </div>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Coupon
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {coupons.length === 0 ? (
              <Card className="p-12 text-center">
                <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Coupons Yet</h3>
                <p className="text-gray-600 mb-6">Create your first coupon to get started</p>
                <Button onClick={() => handleOpenModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Coupon
                </Button>
              </Card>
            ) : (
              coupons.map((coupon) => (
                <Card key={coupon.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{coupon.code}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {coupon.discount_type === 'percentage'
                            ? `${coupon.discount_value}% OFF`
                            : `₹${coupon.discount_value} OFF`}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>From {new Date(coupon.valid_from).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Until {new Date(coupon.valid_until).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <TrendingUp className="w-4 h-4" />
                          <span>
                            Used: {coupon.current_uses}
                            {coupon.max_uses ? ` / ${coupon.max_uses}` : ''}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">Scope:</span>{' '}
                          {coupon.applicable_events ? `${coupon.applicable_events.length} events` : 'All events'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(coupon.id, coupon.is_active)}
                      >
                        {coupon.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenModal(coupon)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(coupon.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Coupon Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g., SUMMER2025"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Discount Type"
              value={formData.discount_type}
              onChange={(e) =>
                setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })
              }
              required
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </Select>
            <Input
              label={formData.discount_type === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}
              type="number"
              value={formData.discount_value}
              onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
              min="0"
              max={formData.discount_type === 'percentage' ? '100' : undefined}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valid From"
              type="date"
              value={formData.valid_from}
              onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              required
            />
            <Input
              label="Valid Until"
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              required
            />
          </div>
          <Input
            label="Max Uses (Optional)"
            type="number"
            value={formData.max_uses}
            onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
            min="1"
            placeholder="Leave empty for unlimited"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applicable Events (Optional)
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.applicable_events.length === 0}
                  onChange={() => setFormData({ ...formData, applicable_events: [] })}
                  className="rounded border-gray-300"
                />
                <span className="font-medium">All Events</span>
              </label>
              {events.map((event) => (
                <label key={event.id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.applicable_events.includes(event.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          applicable_events: [...formData.applicable_events, event.id],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          applicable_events: formData.applicable_events.filter((id) => id !== event.id),
                        });
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span>{event.title}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
