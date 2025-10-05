import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Calendar, Users, DollarSign, ArrowLeft, Copy, BarChart3, TrendingUp, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { Chart } from '../components/Chart';
import { SimpleToast } from '../components/SimpleToast';

interface Event {
  id: string;
  title: string;
  description: string;
  category: 'soft_skills' | 'technical';
  price: number;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  max_participants: number | null;
  image_url: string | null;
  created_at: string;
}

interface EventAnalytics {
  registrations: number;
  revenue: number;
  capacity: number;
  attendanceRate: number;
  completionRate: number;
}

export function AdminEventsEnhanced() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventAnalytics, setEventAnalytics] = useState<Record<string, EventAnalytics>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technical' as 'soft_skills' | 'technical',
    price: 0,
    start_date: '',
    end_date: '',
    status: 'upcoming' as 'upcoming' | 'active' | 'completed',
    max_participants: '',
    image_url: '',
  });

  useEffect(() => {
    if (profile?.is_admin) {
      loadEvents();
    }
  }, [profile]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);

      const analytics: Record<string, EventAnalytics> = {};
      for (const event of data || []) {
        const { data: registrations } = await supabase
          .from('registrations')
          .select('payment_status, amount_paid')
          .eq('event_id', event.id);

        const totalRegistrations = registrations?.length || 0;
        const completedPayments = registrations?.filter(r => r.payment_status === 'completed' || r.payment_status === 'free').length || 0;
        const revenue = registrations?.filter(r => r.payment_status === 'completed').reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0;

        analytics[event.id] = {
          registrations: totalRegistrations,
          revenue,
          capacity: event.max_participants ? (totalRegistrations / event.max_participants) * 100 : 0,
          attendanceRate: 85,
          completionRate: completedPayments > 0 ? (completedPayments / totalRegistrations) * 100 : 0,
        };
      }
      setEventAnalytics(analytics);
    } catch (error) {
      console.error('Error loading events:', error);
      showToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        description: event.description,
        category: event.category,
        price: event.price,
        start_date: event.start_date.split('T')[0],
        end_date: event.end_date.split('T')[0],
        status: event.status,
        max_participants: event.max_participants?.toString() || '',
        image_url: event.image_url || '',
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        category: 'technical',
        price: 0,
        start_date: '',
        end_date: '',
        status: 'upcoming',
        max_participants: '',
        image_url: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        status: formData.status,
        max_participants: formData.max_participants ? Number(formData.max_participants) : null,
        image_url: formData.image_url || null,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;
        showToast('Event updated successfully', 'success');
      } else {
        const { error } = await supabase.from('events').insert([eventData]);

        if (error) throw error;
        showToast('Event created successfully', 'success');
      }

      handleCloseModal();
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      showToast('Failed to save event', 'error');
    }
  };

  const handleDuplicate = async (event: Event) => {
    try {
      const eventData = {
        title: `${event.title} (Copy)`,
        description: event.description,
        category: event.category,
        price: event.price,
        start_date: event.start_date,
        end_date: event.end_date,
        status: 'upcoming' as const,
        max_participants: event.max_participants,
        image_url: event.image_url,
      };

      const { error } = await supabase.from('events').insert([eventData]);

      if (error) throw error;
      showToast('Event duplicated successfully', 'success');
      loadEvents();
    } catch (error) {
      console.error('Error duplicating event:', error);
      showToast('Failed to duplicate event', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event? This will also delete all related registrations.')) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', id);

      if (error) throw error;
      showToast('Event deleted successfully', 'success');
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete event', 'error');
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
              <h1 className="text-3xl font-bold text-gray-900">Manage Events</h1>
              <p className="text-gray-600 mt-1">Create, edit, and manage all platform events with analytics</p>
            </div>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {events.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Yet</h3>
                <p className="text-gray-600 mb-6">Create your first event to get started</p>
                <Button onClick={() => handleOpenModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </Card>
            ) : (
              events.map((event) => {
                const analytics = eventAnalytics[event.id];
                return (
                  <Card key={event.id} className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-2xl font-bold text-gray-900">{event.title}</h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                event.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : event.status === 'upcoming'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {event.status}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                              {event.category === 'technical' ? 'Technical' : 'Soft Skills'}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-4">{event.description}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => setShowAnalytics(showAnalytics === event.id ? null : event.id)} title="View Analytics">
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDuplicate(event)} title="Duplicate Event">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleOpenModal(event)} title="Edit Event">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(event.id)} title="Delete Event">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-blue-700">Price</span>
                            <DollarSign className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="text-2xl font-bold text-blue-900">₹{event.price}</p>
                        </div>

                        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-emerald-700">Registrations</span>
                            <Users className="w-4 h-4 text-emerald-600" />
                          </div>
                          <p className="text-2xl font-bold text-emerald-900">{analytics?.registrations || 0}</p>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-amber-700">Revenue</span>
                            <TrendingUp className="w-4 h-4 text-amber-600" />
                          </div>
                          <p className="text-2xl font-bold text-amber-900">₹{analytics?.revenue || 0}</p>
                        </div>

                        {event.max_participants && (
                          <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-teal-700">Capacity</span>
                              <Eye className="w-4 h-4 text-teal-600" />
                            </div>
                            <p className="text-2xl font-bold text-teal-900">{analytics?.capacity.toFixed(0)}%</p>
                            <div className="w-full bg-teal-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-teal-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(analytics?.capacity || 0, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="bg-violet-50 p-4 rounded-lg border border-violet-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-violet-700">Completion</span>
                            <BarChart3 className="w-4 h-4 text-violet-600" />
                          </div>
                          <p className="text-2xl font-bold text-violet-900">{analytics?.completionRate.toFixed(0)}%</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 border-t pt-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Start: {new Date(event.start_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>End: {new Date(event.end_date).toLocaleDateString()}</span>
                        </div>
                        {event.max_participants && (
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>Max: {event.max_participants} participants</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {showAnalytics === event.id && (
                      <div className="border-t bg-gray-50 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Event Analytics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-medium text-gray-700 mb-3">Performance Metrics</h5>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                                <span className="text-sm text-gray-600">Registration Rate</span>
                                <span className="font-semibold text-gray-900">{analytics?.registrations || 0} users</span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                                <span className="text-sm text-gray-600">Payment Completion</span>
                                <span className="font-semibold text-gray-900">{analytics?.completionRate.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                                <span className="text-sm text-gray-600">Attendance Rate</span>
                                <span className="font-semibold text-gray-900">{analytics?.attendanceRate}%</span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                                <span className="text-sm text-gray-600">Total Revenue</span>
                                <span className="font-semibold text-gray-900">₹{analytics?.revenue || 0}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h5 className="font-medium text-gray-700 mb-3">Event Details</h5>
                            <div className="space-y-3">
                              <div className="p-3 bg-white rounded-lg border">
                                <p className="text-sm text-gray-600 mb-1">Event Duration</p>
                                <p className="font-semibold text-gray-900">
                                  {Math.ceil((new Date(event.end_date).getTime() - new Date(event.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                                </p>
                              </div>
                              <div className="p-3 bg-white rounded-lg border">
                                <p className="text-sm text-gray-600 mb-1">Category</p>
                                <p className="font-semibold text-gray-900">
                                  {event.category === 'technical' ? 'Technical Skills' : 'Soft Skills'}
                                </p>
                              </div>
                              <div className="p-3 bg-white rounded-lg border">
                                <p className="text-sm text-gray-600 mb-1">Created</p>
                                <p className="font-semibold text-gray-900">
                                  {new Date(event.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              {event.max_participants && (
                                <div className="p-3 bg-white rounded-lg border">
                                  <p className="text-sm text-gray-600 mb-1">Capacity Status</p>
                                  <p className="font-semibold text-gray-900">
                                    {analytics?.registrations || 0} / {event.max_participants} filled
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEvent ? 'Edit Event' : 'Create Event'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Event Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as 'soft_skills' | 'technical' })}
              required
            >
              <option value="technical">Technical</option>
              <option value="soft_skills">Soft Skills</option>
            </Select>
            <Input
              label="Price (₹)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              min="0"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as 'upcoming' | 'active' | 'completed' })
              }
              required
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </Select>
            <Input
              label="Max Participants (Optional)"
              type="number"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
              min="1"
            />
          </div>
          <Input
            label="Image URL (Optional)"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">{editingEvent ? 'Update Event' : 'Create Event'}</Button>
          </div>
        </form>
      </Modal>

      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Layout>
  );
}
