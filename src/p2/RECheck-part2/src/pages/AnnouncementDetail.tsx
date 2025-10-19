import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import useAuth from '@/hooks/useAuth';
import { Megaphone, Paperclip, ArrowLeft, User, Calendar } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  description: string;
  created_by_email: string;
  created_at: string;
  audience: string;
  attachments?: string[];
}

export default function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnnouncement = async () => {
      if (!id) {
        setError('No announcement ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get user role first to check access
        let role = 'researcher';
        try {
          const email = (user as any)?.email;
          if (email) {
            const { data } = await supabase.from('users').select('role').eq('email', email).single();
            if (data?.role) role = data.role.toLowerCase();
          }
        } catch (e) {
          // ignore
        }

        const { data, error: fetchError } = await supabase
          .from('announcements')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          setError('Announcement not found');
          return;
        }

        // Check if user has access to this announcement
        const audiences: string[] = ['all'];
        if (role === 'researcher') audiences.push('students');
        if (role === 'reviewer' || role === 'chairperson') audiences.push('committee');

        if (!audiences.includes(data.audience) && data.audience !== 'all') {
          setError('You do not have access to this announcement');
          return;
        }

        setAnnouncement(data);
      } catch (err) {
        console.error('Error loading announcement:', err);
        setError('Failed to load announcement');
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncement();
  }, [id, user]);

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case 'all':
        return 'bg-green-100 text-green-800';
      case 'students':
        return 'bg-blue-100 text-blue-800';
      case 'committee':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/announcements')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Announcements
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 font-medium mb-2">Error</div>
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/announcements')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Announcements
          </button>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <div className="text-gray-600">Announcement not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/announcements')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Announcements
        </button>

        {/* Announcement Detail Card */}
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-8 border-b border-gray-100">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 rounded-xl bg-indigo-100 p-4 text-indigo-600">
                <Megaphone className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                    {announcement.title}
                  </h1>
                  <span className={`inline-flex text-sm font-medium px-3 py-1.5 rounded-full ${getAudienceColor(announcement.audience)}`}>
                    {announcement.audience === 'all' ? 'Everyone' : 
                     announcement.audience === 'students' ? 'Researchers' : 
                     announcement.audience === 'committee' ? 'Committee' : announcement.audience}
                  </span>
                </div>
                
                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-6 text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{announcement.created_by_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{formatDate(announcement.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="prose max-w-none">
              <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                {announcement.description}
              </div>
            </div>

            {/* Attachments */}
            {announcement.attachments && announcement.attachments.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-gray-500" />
                  Attachments ({announcement.attachments.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {announcement.attachments.map((url: string, index: number) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 hover:border-gray-300"
                    >
                      <div className="flex-shrink-0 rounded-md bg-blue-100 p-2">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          Attachment {index + 1}
                        </div>
                        <div className="text-xs text-gray-500">
                          Click to view
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
