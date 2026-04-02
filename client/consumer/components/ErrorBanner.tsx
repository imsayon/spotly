import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface ErrorBannerProps {
  visible?: boolean;
  message?: string;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}

/**
 * Error/Warning banner component
 * Displays error messages with optional dismiss action
 */
export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  visible = true,
  message,
  onDismiss,
  type = 'error',
}) => {
  if (!visible || !message) return null;

  const colorMap = {
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  const backgroundColor = colorMap[type];
  const bgColor = type === 'error' ? '#fee2e2' : type === 'warning' ? '#fef3c7' : '#dbeafe';

  return (
    <View style={[s.container, { backgroundColor: bgColor }]}>
      <View style={s.content}>
        <Text style={[s.icon, { color: backgroundColor }]}>
          {type === 'error' ? '⚠️' : type === 'warning' ? '⚡' : 'ℹ️'}
        </Text>
        <Text style={[s.message, { color: backgroundColor }]}>{message}</Text>
      </View>
      {onDismiss && (
        <Pressable onPress={onDismiss} style={s.closeBtn}>
          <Text style={[s.close, { color: backgroundColor }]}>✕</Text>
        </Pressable>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  close: {
    fontSize: 16,
    fontWeight: '600',
  },
});
