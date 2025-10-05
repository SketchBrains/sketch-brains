import React, { useEffect, useState } from 'react';
import { Mail, Send, Calendar, Users, BarChart3, FileText, Plus, Filter, Search, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Layout } from '../components/Layout';
import { Tabs } from '../components/Tabs';
import { Modal } from '../components/Modal';
import { Select } from '../components/Select';
import { Textarea } from '../components/Textarea';
import { SimpleToast } from '../components/SimpleToast';

interface Event {
  id: string;
  title: string;
  event_date: string;
}

interface Participant {
  id: string;
  email: string;
  full_name: string;
  payment_status: string;
  event_id: string;
  event_title: string;
}

interface NotificationStats {
  totalSent: number;
  totalPending: number;
  deliveryRate: number;
  openRate: number;
}

export function AdminNotifications() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<NotificationStats>({
    totalSent: 0,
    totalPending: 0,
    deliveryRate: 0,
    openRate: 0,
  });

  const [emailForm, setEmailForm] = useState({
    subject: '',
    body: '',
    scheduleDate: '',
    scheduleTime: '',
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (profile?.is_admin) {
      loadData();
    }
  }, [profile]);

  useEffect(() => {
    filterParticipants();
  }, [selectedEvent, selectedPaymentStatus, searchTerm, participants]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, registrationsRes, statsRes] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, event_date')
          .order('event_date', { ascending: false }),
        supabase
          .from('registrations')
          .select(`
            id,
            payment_status,
            user_id,
            event_id,
            events (
              id,
              title
            ),
            profiles (
              email,
              full_name
            )
          `),
        supabase
          .from('notifications_queue')
          .select('status, metadata')
      ]);

      if (eventsRes.data) {
        setEvents(eventsRes.data);
      }

      if (registrationsRes.data) {
        const participantData = registrationsRes.data.map((reg: any) => ({
          id: reg.id,
          email: reg.profiles?.email || '',
          full_name: reg.profiles?.full_name || 'N/A',
          payment_status: reg.payment_status,
          event_id: reg.event_id,
          event_title: reg.events?.title || 'N/A',
        }));
        setParticipants(participantData);
      }

      if (statsRes.data) {
        const totalSent = statsRes.data.filter(n => n.status === 'sent').length;
        const totalPending = statsRes.data.filter(n => n.status === 'pending').length;
        const delivered = statsRes.data.filter(n => n.metadata?.delivered).length;
        const opened = statsRes.data.filter(n => n.metadata?.opened).length;

        setStats({
          totalSent,
          totalPending,
          deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
          openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterParticipants = () => {
    let filtered = participants;

    if (selectedEvent !== 'all') {
      filtered = filtered.filter(p => p.event_id === selectedEvent);
    }

    if (selectedPaymentStatus !== 'all') {
      filtered = filtered.filter(p => p.payment_status === selectedPaymentStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.full_name.toLowerCase().includes(term) ||
          p.email.toLowerCase().includes(term) ||
          p.event_title.toLowerCase().includes(term)
      );
    }

    setFilteredParticipants(filtered);
  };

  const toggleSelectAll = () => {
    if (selectedParticipants.size === filteredParticipants.length) {
      setSelectedParticipants(new Set());
    } else {
      setSelectedParticipants(new Set(filteredParticipants.map(p => p.id)));
    }
  };

  const toggleParticipant = (id: string) => {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedParticipants(newSelected);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendEmail = async (scheduled: boolean = false) => {
    if (!emailForm.subject || !emailForm.body) {
      showToast('Please fill in subject and message', 'error');
      return;
    }

    if (selectedParticipants.size === 0) {
      showToast('Please select at least one recipient', 'error');
      return;
    }

    setSending(true);
    try {
      const selectedData = filteredParticipants.filter(p => selectedParticipants.has(p.id));

      let scheduledFor = new Date();
      if (scheduled && emailForm.scheduleDate && emailForm.scheduleTime) {
        scheduledFor = new Date(`${emailForm.scheduleDate}T${emailForm.scheduleTime}`);
      }

      const notifications = selectedData.map(participant => ({
        user_id: participant.id,
        type: 'email',
        channel: 'marketing',
        subject: emailForm.subject,
        body: emailForm.body
          .replace(/{{name}}/g, participant.full_name)
          .replace(/{{email}}/g, participant.email)
          .replace(/{{event_title}}/g, participant.event_title),
        status: 'pending',
        priority: 'medium',
        scheduled_for: scheduledFor.toISOString(),
        metadata: {
          event_id: participant.event_id,
          campaign_type: 'bulk_email',
        },
      }));

      const { error } = await supabase
        .from('notifications_queue')
        .insert(notifications);

      if (error) throw error;

      showToast(
        scheduled
          ? `Email scheduled for ${selectedParticipants.size} recipients`
          : `Email queued for ${selectedParticipants.size} recipients`,
        'success'
      );

      setShowComposeModal(false);
      setShowScheduleModal(false);
      setEmailForm({ subject: '', body: '', scheduleDate: '', scheduleTime: '' });
      setSelectedParticipants(new Set());
      loadData();
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Failed to send email', 'error');
    } finally {
      setSending(false);
    }
  };

  const insertTemplate = (template: string) => {
    const templates: Record<string, { subject: string; body: string }> = {
      reminder: {
        subject: 'Reminder: {{event_title}} is coming up!',
        body: `Hi {{name}},\n\nThis is a friendly reminder that {{event_title}} is coming up soon!\n\nWe look forward to seeing you there.\n\nBest regards,\nSketch Brains Team`,
      },
      materials: {
        subject: 'New Materials Available: {{event_title}}',
        body: `Hi {{name}},\n\nGood news! New course materials have been uploaded for {{event_title}}.\n\nYou can access them from your dashboard.\n\nBest regards,\nSketch Brains Team`,
      },
      welcome: {
        subject: 'Welcome to {{event_title}}!',
        body: `Hi {{name}},\n\nThank you for registering for {{event_title}}!\n\nWe're excited to have you join us. You'll receive more details closer to the event date.\n\nBest regards,\nSketch Brains Team`,
      },
    };

    if (templates[template]) {
      setEmailForm(prev => ({
        ...prev,
        subject: templates[template].subject,
        body: templates[template].body,
      }));
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
            <p className="text-gray-600 mt-1">Send targeted emails and manage communications</p>
          </div>
          <Button onClick={() => setShowComposeModal(true)} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Compose Email
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1 font-medium">Total Sent</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalSent}</p>
              </div>
              <Send className="w-12 h-12 text-blue-600 opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 mb-1 font-medium">Pending</p>
                <p className="text-3xl font-bold text-amber-900">{stats.totalPending}</p>
              </div>
              <Clock className="w-12 h-12 text-amber-600 opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 mb-1 font-medium">Delivery Rate</p>
                <p className="text-3xl font-bold text-emerald-900">{stats.deliveryRate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="w-12 h-12 text-emerald-600 opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-700 mb-1 font-medium">Open Rate</p>
                <p className="text-3xl font-bold text-teal-900">{stats.openRate.toFixed(1)}%</p>
              </div>
              <Mail className="w-12 h-12 text-teal-600 opacity-80" />
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Select Recipients</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                {selectedParticipants.size} of {filteredParticipants.length} selected
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                icon={<Calendar className="w-5 h-5" />}
              >
                <option value="all">All Events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.title}</option>
                ))}
              </Select>

              <Select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                icon={<Filter className="w-5 h-5" />}
              >
                <option value="all">All Payment Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="free">Free</option>
              </Select>

              <Input
                type="text"
                placeholder="Search participants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5" />}
              />
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedParticipants.size === filteredParticipants.length && filteredParticipants.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-700">Select All</span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredParticipants.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No participants found matching your filters</p>
                  </div>
                ) : (
                  filteredParticipants.map(participant => (
                    <div
                      key={participant.id}
                      className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                      onClick={() => toggleParticipant(participant.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedParticipants.has(participant.id)}
                        onChange={() => toggleParticipant(participant.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{participant.full_name}</p>
                        <p className="text-sm text-gray-500 truncate">{participant.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">{participant.event_title}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          participant.payment_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : participant.payment_status === 'free'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {participant.payment_status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        title="Compose Email"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Templates
            </label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => insertTemplate('reminder')}
              >
                <FileText className="w-4 h-4 mr-1" />
                Event Reminder
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => insertTemplate('materials')}
              >
                <FileText className="w-4 h-4 mr-1" />
                New Materials
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => insertTemplate('welcome')}
              >
                <FileText className="w-4 h-4 mr-1" />
                Welcome Message
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Available merge tags: {'{'}{'{'} name{'}'}{'}'}, {'{{'}email{'}'}{'}'}, {'{{'}event_title{'}}'}
            </p>
          </div>

          <Input
            label="Subject"
            type="text"
            value={emailForm.subject}
            onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
            placeholder="Enter email subject"
            required
          />

          <Textarea
            label="Message"
            value={emailForm.body}
            onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
            placeholder="Enter your message here..."
            rows={8}
            required
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>{selectedParticipants.size}</strong> recipient(s) selected
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => handleSendEmail(false)}
              disabled={sending}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Now'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowComposeModal(false);
                setShowScheduleModal(true);
              }}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Email"
      >
        <div className="space-y-4">
          <Input
            label="Subject"
            type="text"
            value={emailForm.subject}
            onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
            placeholder="Enter email subject"
            required
          />

          <Textarea
            label="Message"
            value={emailForm.body}
            onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
            placeholder="Enter your message here..."
            rows={6}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={emailForm.scheduleDate}
              onChange={(e) => setEmailForm({ ...emailForm, scheduleDate: e.target.value })}
              required
            />
            <Input
              label="Time"
              type="time"
              value={emailForm.scheduleTime}
              onChange={(e) => setEmailForm({ ...emailForm, scheduleTime: e.target.value })}
              required
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              Email will be sent to <strong>{selectedParticipants.size}</strong> recipient(s) at the scheduled time
            </p>
          </div>

          <Button
            onClick={() => handleSendEmail(true)}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            {sending ? 'Scheduling...' : 'Schedule Email'}
          </Button>
        </div>
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
