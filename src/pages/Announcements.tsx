import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import useAuth from '@/hooks/useAuth';
import { Megaphone, Paperclip, Clock } from 'lucide-react';

export default function Announcements() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
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

        const audiences: string[] = ['all'];
        if (role === 'researcher') audiences.push('students');
        if (role === 'reviewer' || role === 'staff') audiences.push('committee');

        const { data } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        const visible = (data || []).filter((a: any) => audiences.includes(a.audience) || a.audience === 'all');
        setItems(visible as any[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600 shadow-sm">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Announcements</h1>
            <p className="text-sm text-gray-500">Latest news and updates for your role</p>
          </div>
        </div>
        <div className="text-sm text-gray-600">{loading ? 'Loading…' : `${items.length} announcement${items.length === 1 ? '' : 's'}`}</div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white p-4 rounded-lg shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-gray-400">No announcements.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map(a => (
            <article key={a.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 rounded-lg bg-indigo-50 p-3 text-indigo-600">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{a.title}</h3>
                      <div className="mt-1 text-sm text-gray-600">{a.created_by_email} • <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(a.created_at).toLocaleString()}</span></div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${a.audience === 'all' ? 'bg-green-100 text-green-800' : a.audience === 'students' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{a.audience}</span>
                    </div>
                  </div>

                  <p className="mt-4 text-gray-700 whitespace-pre-line">{a.description}</p>

                  {a.attachments && a.attachments.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {a.attachments.map((u: string, i: number) => (
                        <a key={i} href={u} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-md text-sm text-gray-700 hover:bg-gray-100">
                          <Paperclip className="w-4 h-4 text-gray-500" /> Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
