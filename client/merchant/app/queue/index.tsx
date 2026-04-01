import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import type { QueueEntry } from '../../types';

// TODO: fetch live queue entries from API
const MOCK_ENTRIES: QueueEntry[] = [];

export default function QueueListScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Live Queue' }} />
      <View style={s.root}>
        <FlatList
          data={MOCK_ENTRIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={s.row}>
              <Text style={s.token}>#{item.tokenNumber}</Text>
              <Text style={[s.status, { color: item.status === 'CALLED' ? '#6366f1' : '#f59e0b' }]}>
                {item.status}
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={s.empty}>No entries in queue</Text>}
          contentContainerStyle={s.list}
        />
      </View>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  list: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1e293b', borderRadius: 10, padding: 14, marginVertical: 4 },
  token: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
  status: { fontSize: 13, fontWeight: '500' },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 48 },
});
