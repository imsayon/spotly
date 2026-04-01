import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Merchant } from '../types';

interface Props {
  merchant: Merchant;
  onPress: (m: Merchant) => void;
}

export const MerchantCard: React.FC<Props> = ({ merchant, onPress }) => (
  <Pressable
    style={({ pressed }) => [s.card, pressed && s.pressed]}
    onPress={() => onPress(merchant)}
  >
    <View style={s.row}>
      <Text style={s.name}>{merchant.name}</Text>
      <Text style={s.tag}>{merchant.category}</Text>
    </View>
    <Text style={s.address}>{merchant.address}</Text>
    {merchant.distanceKm !== undefined && (
      <Text style={s.meta}>{merchant.distanceKm.toFixed(1)} km away</Text>
    )}
    {merchant.queueState && (
      <Text style={s.queue}>
        Serving #{merchant.queueState.currentToken} · Next #{merchant.queueState.nextToken}
      </Text>
    )}
  </Pressable>
);

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginVertical: 6, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  pressed: { opacity: 0.85 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '600', color: '#111' },
  tag: { fontSize: 11, color: '#6366f1', backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  address: { fontSize: 13, color: '#555' },
  meta: { fontSize: 12, color: '#999', marginTop: 4 },
  queue: { fontSize: 12, color: '#10b981', marginTop: 6, fontWeight: '500' },
});
