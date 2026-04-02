import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { QueueStatus, QUEUE_STATUS_COLORS } from '../types';

interface StatusBadgeProps {
  status: QueueStatus;
  size?: 'small' | 'medium' | 'large';
}

const statusEmojis: Record<QueueStatus, string> = {
  WAITING: '⏳',
  CALLED: '📞',
  SERVED: '✅',
  MISSED: '⚠️',
  CANCELLED: '❌',
};

const statusLabels: Record<QueueStatus, string> = {
  WAITING: 'Waiting',
  CALLED: 'Called',
  SERVED: 'Served',
  MISSED: 'Missed',
  CANCELLED: 'Cancelled',
};

/**
 * Status badge component
 * Displays queue status with color coding
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const { QUEUE_STATUS_COLORS } = require('../types');
  const color = QUEUE_STATUS_COLORS[status] ?? '#ccc';

  const sizes = {
    small: { fontSize: 11, paddingHorizontal: 10, paddingVertical: 4 },
    medium: { fontSize: 13, paddingHorizontal: 14, paddingVertical: 6 },
    large: { fontSize: 15, paddingHorizontal: 18, paddingVertical: 8 },
  };

  const config = sizes[size];

  return (
    <View style={[s.badge, { backgroundColor: color }]}>
      <Text style={s.emoji}>{statusEmojis[status]}</Text>
      <Text
        style={[
          s.text,
          {
            fontSize: config.fontSize,
            paddingHorizontal: config.paddingHorizontal - 4,
            paddingVertical: config.paddingVertical,
          },
        ]}
      >
        {statusLabels[status]}
      </Text>
    </View>
  );
};

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  emoji: {
    fontSize: 14,
    marginRight: 4,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
