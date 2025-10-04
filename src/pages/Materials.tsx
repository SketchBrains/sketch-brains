import React, { useEffect, useState } from 'react';
import { Download, FileText, Film, Presentation, File } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import type { Database } from '../lib/database.types';

type Material = Database['public']['Tables']['materials']['Row'] & {
  events: { title: string };
};

export function Materials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMaterials();
    }
  }, [user]);

  const loadMaterials = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('event_id')
        .eq('user_id', user.id)
        .in('payment_status', ['completed', 'free']);

      if (regError) throw regError;

      const eventIds = registrations?.map((r) => r.event_id) || [];

      if (eventIds.length === 0) {
        setMaterials([]);
        setLoading(false);
        return;
      }

      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('*, events(title)')
        .in('event_id', eventIds)
        .order('uploaded_at', { ascending: false });

      if (materialsError) throw materialsError;
      setMaterials(materialsData as any || []);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'notes':
        return <FileText className="w-8 h-8 text-blue-600" />;
      case 'slides':
        return <Presentation className="w-8 h-8 text-green-600" />;
      case 'recording':
        return <Film className="w-8 h-8 text-purple-600" />;
      default:
        return <File className="w-8 h-8 text-gray-600" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Materials</h1>
          <p className="text-gray-600 mt-1">Download materials from your registered events</p>
        </div>

        {materials.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No materials yet</h3>
            <p className="text-gray-600 mb-6">
              Materials will appear here once you register for events and organizers upload them
            </p>
            <a href="/events" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Browse Events
            </a>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <Card key={material.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">{getFileIcon(material.file_type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                      {material.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{material.events.title}</p>
                    {material.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {material.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatDate(material.uploaded_at)}
                      </span>
                      <a
                        href={material.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
