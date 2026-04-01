import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { QueueEntry } from '../types';

const STATUS_COLOR: Record<string, string> = {
  WAITING: '#f59e0b',
  CALLED: '#6366f1',
  SERVED: '#10b981',
  MISSED: '#ef4444',
  CANCELLED: '#9ca3af',
};

export const QueueStatus: React.FC<{ entry: QueueEntry }> = ({ entry }) => (
  <View style={s.wrap}>
    <Text style={s.label}>Your Token</Text>
    <Text style={s.token}>#{entry.tokenNumber}</Text>
    <View style={[s.badge, { backgroundColor: STATUS_COLOR[entry.status] ?? '#ccc' }]}>
      <Text style={s.status}>{entry.status}</Text>
    </View>
    {entry.position !== null && entry.status === 'WAITING' && (
      <Text style={s.pos}>
        {entry.position === 0 ? "You're next! 🎉" : `${entry.position} ahead of you`}
      </Text>
    )}
  </View>
);

const s = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 48 },
  label: { fontSize: 14, color: '#888', marginBottom: 8 },
  token: { fontSize: 80, fontWeight: '800', color: '#111', lineHeight: 88 },
  badge: { paddingHorizontal: 18, paddingVertical: 5, borderRadius: 100, marginTop: 10 },
  status: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  pos: { fontSize: 14, color: '#666', marginTop: 20, textAlign: 'center' },
});
