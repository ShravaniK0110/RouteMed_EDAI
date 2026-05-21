'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export type AppNotification = {
  id?: string;
  user_id: string;
  user_type?: 'patient' | 'paramedic' | 'hospital';
  title: string;
  body: string;
  data?: any;
  created_at?: string;
  is_read?: boolean;
};

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [latestNotification, setLatestNotification] =
    useState<AppNotification | null>(null);

  useEffect(() => {
    if (!userId) return;

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => {});
    }

    const loadExistingNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setNotifications(data);
      }
    };

    loadExistingNotifications();

    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as AppNotification;

          setNotifications((prev) => [
            notification,
            ...prev,
          ]);

          setLatestNotification(notification);

          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification(notification.title, {
              body: notification.body,
            });
          }

          setTimeout(() => {
            setLatestNotification(null);
          }, 6000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    notifications,
    latestNotification,
  };
}