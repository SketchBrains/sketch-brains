import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, Users, Tag, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Layout } from '../components/Layout';
import type { Database } from '../lib/database.types';

type Event = Database['public']['Tables']['events']['Row'];
type Registration = Database['public']['Tables']['registrations']['Row'];

export function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvent();
      if (user) {
        checkRegistration();
      }
    }
  }, [id, user]);

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', id)
        .maybeSingle();

      if (error) throw error;
      setRegistration(data);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode || !event) return;

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        alert('Invalid coupon code');
        return;
      }

      const now = new Date();
      const validFrom = new Date(data.valid_from);
      const validUntil = new Date(data.valid_until);

      if (now < validFrom || now > validUntil) {
        alert('Coupon has expired or is not yet valid');
        return;
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        alert('Coupon has reached maximum usage');
        return;
      }

      if (data.applicable_events && !data.applicable_events.includes(event.id)) {
        alert('Coupon not applicable to this event');
        return;
      }

      const discountAmount =
        data.discount_type === 'percentage'
          ? (event.price * data.discount_value) / 100
          : data.discount_value;

      setDiscount(Math.min(discountAmount, event.price));
      alert('Coupon applied successfully!');
    } catch (error) {
      console.error('Error applying coupon:', error);
      alert('Error applying coupon');
    }
  };

  const handleRegister = async () => {
    if (!user || !event) {
      window.location.href = '/login';
      return;
    }

    setProcessing(true);

    try {
      const finalAmount = Math.max(0, event.price - discount);

      const { error } = await supabase.from('registrations').insert({
        user_id: user.id,
        event_id: event.id,
        amount_paid: finalAmount,
        coupon_code: couponCode || null,
        payment_status: finalAmount === 0 ? 'free' : 'pending',
      });

      if (error) throw error;

      if (finalAmount === 0) {
        alert('Registration successful!');
        checkRegistration();
      } else {
        alert('Redirecting to payment...');
      }
    } catch (error: any) {
      console.error('Error registering:', error);
      alert(error.message || 'Error during registration');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <Card className="p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Event not found</h3>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
          <a href="/events">
            <Button>View All Events</Button>
          </a>
        </Card>
      </Layout>
    );
  }

  const finalPrice = Math.max(0, event.price - discount);

  return (
    <Layout>
      <div className="space-y-6">
        <a href="/events" className="inline-flex items-center text-blue-600 hover:text-blue-700">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </a>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              {event.image_url && (
                <img src={event.image_url} alt={event.title} className="w-full h-64 object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      event.status === 'upcoming'
                        ? 'bg-blue-100 text-blue-800'
                        : event.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {event.category === 'soft_skills' ? 'Soft Skills' : 'Technical'}
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-5 h-5 mr-3" />
                    <span>Starts: {formatDate(event.start_date)}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Clock className="w-5 h-5 mr-3" />
                    <span>Ends: {formatDate(event.end_date)}</span>
                  </div>
                  {event.max_participants && (
                    <div className="flex items-center text-gray-700">
                      <Users className="w-5 h-5 mr-3" />
                      <span>Max {event.max_participants} participants</span>
                    </div>
                  )}
                </div>

                <div className="prose max-w-none">
                  <h2 className="text-xl font-semibold mb-3">About this event</h2>
                  <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Registration</h3>

              {registration ? (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg ${
                      registration.payment_status === 'completed' || registration.payment_status === 'free'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">
                      {registration.payment_status === 'completed' || registration.payment_status === 'free'
                        ? 'You are registered!'
                        : 'Registration pending payment'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Amount: ₹{registration.amount_paid}
                    </p>
                  </div>
                  <a href="/dashboard">
                    <Button className="w-full">Go to Dashboard</Button>
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-blue-600 mb-1">
                      ₹{finalPrice}
                    </p>
                    {discount > 0 && (
                      <p className="text-sm text-gray-500">
                        <span className="line-through">₹{event.price}</span> (₹{discount} off)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <Button variant="outline" onClick={applyCoupon}>
                        <Tag className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleRegister}
                    disabled={processing || event.status === 'completed'}
                  >
                    {processing
                      ? 'Processing...'
                      : event.status === 'completed'
                      ? 'Event Completed'
                      : finalPrice === 0
                      ? 'Register for Free'
                      : 'Proceed to Payment'}
                  </Button>

                  {!user && (
                    <p className="text-xs text-gray-600 text-center">
                      Please sign in to register for this event
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
