// lib/supabase.js
// Cliente de Supabase para uso en el frontend (browser)

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Hook para usar en componentes React
import { useEffect, useState } from 'react';

export function useSupabase() {
  const [supabase] = useState(() => createClient());
  return supabase;
}

// ============================================================
// Hooks de datos más usados
// ============================================================

// Hook: datos del usuario actual
export function useUser() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase
          .from('users')
          .select('*, leaderboard(*)')
          .eq('auth_id', session.user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, loading };
}

// Hook: ranking en tiempo real (Supabase Realtime)
export function useLeaderboard(limit = 50) {
  const supabase = createClient();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      const { data } = await supabase
        .from('v_leaderboard')
        .select('*')
        .limit(limit);
      setRanking(data || []);
      setLoading(false);
    };
    fetchRanking();

    // Suscripción en tiempo real: se actualiza cuando cambia el leaderboard
    const subscription = supabase
      .channel('leaderboard_changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leaderboard' },
        () => fetchRanking()
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [limit]);

  return { ranking, loading };
}

// Hook: partidos con actualización en tiempo real
export function useMatches(phase = null) {
  const supabase = createClient();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      let query = supabase
        .from('matches')
        .select('*')
        .order('scheduled_at', { ascending: true });
      if (phase) query = query.eq('phase', phase);
      const { data } = await query;
      setMatches(data || []);
      setLoading(false);
    };
    fetchMatches();

    // Actualizar cuando cambia el score (partido en vivo)
    const subscription = supabase
      .channel('matches_live')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        (payload) => {
          setMatches(prev =>
            prev.map(m => m.id === payload.new.id ? payload.new : m)
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [phase]);

  return { matches, loading };
}

// Hook: notificaciones del usuario en tiempo real
export function useNotifications(userId) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [userId]);

  return { notifications };
}
