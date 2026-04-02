import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';

export type NotificationType = 'called' | 'position-alert' | 'discount' | 'info';

interface NotificationBannerProps {
  visible?: boolean;
  type?: NotificationType;
  title?: string;
  message?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  autoHide?: boolean;
  duration?: number; // in milliseconds
  onDismiss?: () => void;
}

const notificationConfig: Record<NotificationType, any> = {
  called: {
    emoji: '📢',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderColor: '#fca5a5',
  },
  'position-alert': {
    emoji: '🔔',
    backgroundColor: '#fef3c7',
    color: '#d97706',
    borderColor: '#fcd34d',
  },
  discount: {
    emoji: '🎉',
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    borderColor: '#86efac',
  },
  info: {
    emoji: 'ℹ️',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    borderColor: '#93c5fd',
  },
};

/**
 * Notification banner component
 * Shows important notifications with action buttons
 * Supports auto-hide and custom styling
 */
export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  visible = true,
  type = 'info',
  title,
  message,
  action,
  autoHide = type === 'called',
  duration = 8000,
  onDismiss,
}) => {
  const [show, setShow] = useState(visible);
  const [animAnim] = useState(new Animated.Value(visible ? 1 : 0));

  useEffect(() => {
    Animated.timing(animAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setShow(visible);
  }, [visible]);

  useEffect(() => {
    if (autoHide && visible) {
      const timer = setTimeout(() => {
        setShow(false);
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, visible, duration, onDismiss]);

  if (!show) return null;

  const config = notificationConfig[type];

  return (
    <Animated.View
      style={[
        s.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          opacity: animAnim,
        },
      ]}
    >
      <View style={s.content}>
        <Text style={s.emoji}>{config.emoji}</Text>
        <View style={s.textContainer}>
          {title && (
            <Text style={[s.title, { color: config.color }]}>{title}</Text>
          )}
          {message && (
            <Text style={[s.message, { color: config.color }]}>{message}</Text>
          )}
        </View>
      </View>

      <View style={s.actions}>
        {action && (
          <Pressable
            style={[s.actionBtn, { backgroundColor: config.color }]}
            onPress={action.onPress}
          >
            <Text style={s.actionText}>{action.label}</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            setShow(false);
            onDismiss?.();
          }}
          style={s.closeBtn}
        >
          <Text style={[s.close, { color: config.color }]}>✕</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  close: {
    fontSize: 16,
    fontWeight: '600',
  },
});
