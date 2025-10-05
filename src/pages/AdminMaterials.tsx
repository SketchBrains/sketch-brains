import React, { useEffect, useState } from 'react';
import { Plus, Trash2, FileText, ArrowLeft, Calendar, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

interface Material {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: 'notes' | 'slides' | 'recording' | 'other';
  uploaded_at: string;
}

interface Event {
  id: string;
  title: string;
}

interface MaterialWithEvent extends Material {
  event_title: string;
}

export function AdminMaterials() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [materials, setMaterials] = useState<MaterialWithEvent[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    event_id: '',
    title: '',
    description: '',
    file_url: '',
    file_type: 'notes' as 'notes' | 'slides' | 'recording' | 'other',
  });

  useEffect(() => {
    if (profile?.is_admin) {
      loadMaterials();
      loadEvents();
    }
  }, [profile]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (materialsError) throw materialsError;

      const { data: eventsData, error: eventsError } = await supabase.from('events').select('id, title');

      if (eventsError) throw eventsError;

      const materialsWithEvents = (materialsData || []).map((material) => {
        const event = eventsData?.find((e) => e.id === material.event_id);
        return {
          ...material,
          event_title: event?.title || 'Unknown Event',
        };
      });

      setMaterials(materialsWithEvents);
    } catch (error) {
      console.error('Error loading materials:', error);
      showToast('Failed to load materials', 'error');
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

  const handleOpenModal = () => {
    setFormData({
      event_id: '',
      title: '',
      description: '',
      file_url: '',
      file_type: 'notes',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const materialData = {
        event_id: formData.event_id,
        title: formData.title,
        description: formData.description || null,
        file_url: formData.file_url,
        file_type: formData.file_type,
      };

      const { error } = await supabase.from('materials').insert([materialData]);

      if (error) throw error;
      showToast('Material uploaded successfully', 'success');
      handleCloseModal();
      loadMaterials();
    } catch (error) {
      console.error('Error uploading material:', error);
      showToast('Failed to upload material', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);

      if (error) throw error;
      showToast('Material deleted successfully', 'success');
      loadMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      showToast('Failed to delete material', 'error');
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'notes':
        return 'bg-blue-100 text-blue-700';
      case 'slides':
        return 'bg-green-100 text-green-700';
      case 'recording':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
              <h1 className="text-3xl font-bold text-gray-900">Manage Materials</h1>
              <p className="text-gray-600 mt-1">Upload and manage event materials</p>
            </div>
          </div>
          <Button onClick={handleOpenModal}>
            <Plus className="w-4 h-4 mr-2" />
            Upload Material
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {materials.length === 0 ? (
              <Card className="p-12 text-center">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Materials Yet</h3>
                <p className="text-gray-600 mb-6">Upload your first material to get started</p>
                <Button onClick={handleOpenModal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Material
                </Button>
              </Card>
            ) : (
              materials.map((material) => (
                <Card key={material.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <h3 className="text-xl font-bold text-gray-900">{material.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getFileTypeColor(material.file_type)}`}>
                          {material.file_type}
                        </span>
                      </div>
                      {material.description && (
                        <p className="text-gray-600 mb-3">{material.description}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="text-sm">
                          <span className="font-semibold text-gray-700">Event:</span>{' '}
                          <span className="text-gray-600">{material.event_title}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(material.uploaded_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm">
                          <a
                            href={material.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            View File
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleDelete(material.id)}>
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

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Upload Material">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Event"
            value={formData.event_id}
            onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
            required
          >
            <option value="">Select an event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </Select>
          <Input
            label="Material Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Lecture Notes - Week 1"
            required
          />
          <Textarea
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Brief description of the material"
          />
          <Select
            label="Material Type"
            value={formData.file_type}
            onChange={(e) =>
              setFormData({ ...formData, file_type: e.target.value as 'notes' | 'slides' | 'recording' | 'other' })
            }
            required
          >
            <option value="notes">Notes</option>
            <option value="slides">Slides</option>
            <option value="recording">Recording</option>
            <option value="other">Other</option>
          </Select>
          <Input
            label="File URL"
            value={formData.file_url}
            onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
            placeholder="https://example.com/file.pdf"
            required
          />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Upload your files to a cloud storage service (Google Drive, Dropbox, etc.) and paste the shareable link here.
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">Upload Material</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
