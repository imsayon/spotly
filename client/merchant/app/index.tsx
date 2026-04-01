import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useMerchantQueue } from '../hooks/useQueue';

// TODO: replace with real auth / merchant store
const MERCHANT_ID = process.env.EXPO_PUBLIC_MERCHANT_ID ?? '';

export default function DashboardScreen() {
  const { queueState, loading, error, advance } = useMerchantQueue(MERCHANT_ID);

  return (
    <>
      <Stack.Screen options={{ title: 'Dashboard' }} />
      <View style={s.root}>
        {loading && <ActivityIndicator size="large" color="#6366f1" />}
        {!!error && <Text style={s.error}>{error}</Text>}

        <View style={s.card}>
          <Text style={s.label}>Now Serving</Text>
          <Text style={s.token}>#{queueState?.currentToken ?? '--'}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>Next Token</Text>
          <Text style={s.token}>#{queueState?.nextToken ?? '--'}</Text>
        </View>

        <Pressable style={s.btn} onPress={advance} disabled={loading}>
          <Text style={s.btnText}>Call Next →</Text>
        </Pressable>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a', padding: 24, gap: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24, alignItems: 'center' },
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  token: { fontSize: 64, fontWeight: '800', color: '#f8fafc' },
  btn: { backgroundColor: '#6366f1', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  error: { color: '#ef4444', textAlign: 'center' },
});
