import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, ArrowLeft, Calendar, TrendingUp, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { useToast } from '../components/Toast';

interface Feedback {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  comments: string | null;
  submitted_at: string;
}

interface FeedbackWithDetails extends Feedback {
  user_name: string;
  event_title: string;
}

interface EventStats {
  event_id: string;
  event_title: string;
  average_rating: number;
  total_feedback: number;
}

export function AdminFeedback() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [feedback, setFeedback] = useState<FeedbackWithDetails[]>([]);
  const [eventStats, setEventStats] = useState<EventStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');

  useEffect(() => {
    if (profile?.is_admin) {
      loadFeedback();
    }
  }, [profile]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      const [profilesRes, eventsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name'),
        supabase.from('events').select('id, title'),
      ]);

      const feedbackWithDetails = (feedbackData || []).map((fb) => {
        const user = profilesRes.data?.find((p) => p.id === fb.user_id);
        const event = eventsRes.data?.find((e) => e.id === fb.event_id);

        return {
          ...fb,
          user_name: user?.full_name || 'Unknown',
          event_title: event?.title || 'Unknown Event',
        };
      });

      setFeedback(feedbackWithDetails);

      const eventStatsMap = new Map<string, { total: number; sum: number; title: string }>();

      feedbackWithDetails.forEach((fb) => {
        if (!eventStatsMap.has(fb.event_id)) {
          eventStatsMap.set(fb.event_id, {
            total: 0,
            sum: 0,
            title: fb.event_title,
          });
        }
        const stats = eventStatsMap.get(fb.event_id)!;
        stats.total++;
        stats.sum += fb.rating;
      });

      const statsArray = Array.from(eventStatsMap.entries()).map(([event_id, stats]) => ({
        event_id,
        event_title: stats.title,
        average_rating: stats.sum / stats.total,
        total_feedback: stats.total,
      }));

      setEventStats(statsArray.sort((a, b) => b.average_rating - a.average_rating));
    } catch (error) {
      console.error('Error loading feedback:', error);
      showToast('Failed to load feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = feedback.filter((fb) => {
    if (selectedEvent !== 'all' && fb.event_id !== selectedEvent) return false;
    if (selectedRating !== 'all' && fb.rating !== Number(selectedRating)) return false;
    return true;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
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
            <h1 className="text-3xl font-bold text-gray-900">Event Feedback</h1>
            <p className="text-gray-600 mt-1">Review ratings and comments from participants</p>
          </div>
        </div>

        {eventStats.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <span>Event Ratings Overview</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventStats.map((stat) => (
                <div key={stat.event_id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{stat.event_title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {renderStars(Math.round(stat.average_rating))}
                      <span className="text-sm font-semibold text-gray-900">
                        {stat.average_rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">{stat.total_feedback} reviews</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-900">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
              <option value="all">All Events</option>
              {eventStats.map((stat) => (
                <option key={stat.event_id} value={stat.event_id}>
                  {stat.event_title}
                </option>
              ))}
            </Select>
            <Select value={selectedRating} onChange={(e) => setSelectedRating(e.target.value)}>
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </Select>
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedback.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Feedback Yet</h3>
                <p className="text-gray-600">
                  {selectedEvent !== 'all' || selectedRating !== 'all'
                    ? 'No feedback matches your filters'
                    : 'Feedback will appear here once participants submit reviews'}
                </p>
              </Card>
            ) : (
              filteredFeedback.map((fb) => (
                <Card key={fb.id} className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{fb.event_title}</h3>
                        </div>
                        <div className="flex items-center space-x-4 mb-3">
                          {renderStars(fb.rating)}
                          <span className="text-sm text-gray-600">by {fb.user_name}</span>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(fb.submitted_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {fb.comments && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-gray-700 leading-relaxed">{fb.comments}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {filteredFeedback.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">
                  {selectedEvent !== 'all' || selectedRating !== 'all' ? 'Filtered' : 'Total'} Feedback
                </span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{filteredFeedback.length}</span>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
