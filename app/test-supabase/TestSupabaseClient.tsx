'use client';

import { createClient } from '@/src/lib/supabase/client';
import { useEffect, useState } from 'react';

export function TestSupabaseClient() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<unknown>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from('users').select('count');

        if (error) {
          setStatus('error');
          setMessage(`Erreur de connexion: ${error.message}`);
          setDetails(error);
          console.error('Erreur Supabase:', error);
        } else {
          setStatus('success');
          setMessage('Connexion Supabase réussie. Les tables sont créées.');
          setDetails({ count: data });
        }
      } catch (err) {
        setStatus('error');
        setMessage(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        setDetails(err);
        console.error('Erreur:', err);
      }
    };

    void testConnection();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-beige-50 to-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-neutral-900">Test de connexion Supabase</h1>

        <div
          className={`p-6 rounded-2xl border-2 mb-6 ${
            status === 'loading'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : status === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="font-semibold text-lg">
              {status === 'loading' && 'Test de connexion...'}
              {status === 'success' && 'Connexion réussie'}
              {status === 'error' && 'Erreur de connexion'}
            </span>
          </div>
          <p className="text-sm mt-2">{message}</p>
        </div>

        {details != null && (
          <div className="bg-white p-6 rounded-2xl border-2 border-beige-200">
            <h2 className="font-semibold mb-3 text-neutral-900">Détails techniques</h2>
            <pre className="bg-neutral-50 p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
