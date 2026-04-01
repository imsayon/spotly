import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { QueueStatus } from '../../components/QueueStatus';
import { useQueue } from '../../hooks/useQueue';

// TODO: replace with real auth store
const MOCK_USER_ID = 'user-placeholder';

export default function QueueScreen() {
  const { merchantId } = useLocalSearchParams<{ merchantId: string }>();
  const { entry, loading, error, join } = useQueue(merchantId);

  return (
    <>
      <Stack.Screen options={{ title: 'Queue' }} />
      <View style={s.root}>
        {loading && <ActivityIndicator size="large" color="#6366f1" />}
        {!!error && <Text style={s.error}>{error}</Text>}
        {entry ? (
          <QueueStatus entry={entry} />
        ) : (
          !loading && (
            <View style={s.center}>
              <Text style={s.hint}>Join the queue to get your token</Text>
              <Pressable style={s.btn} onPress={() => join(MOCK_USER_ID)}>
                <Text style={s.btnText}>Join Queue</Text>
              </Pressable>
            </View>
          )
        )}
      </View>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc', padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint: { fontSize: 15, color: '#666', marginBottom: 24, textAlign: 'center' },
  btn: { backgroundColor: '#6366f1', paddingVertical: 14, paddingHorizontal: 48, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: '#ef4444', textAlign: 'center', marginBottom: 16 },
});
