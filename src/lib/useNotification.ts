'use client';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to new notifications for this user
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        // Browser notification (if permission granted)
        if (Notification.permission === 'granted') {
          new Notification(payload.new.title, { body: payload.new.body });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return notifications;
}