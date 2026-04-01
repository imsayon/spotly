import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useRouter, Stack } from 'expo-router';
import { MerchantCard } from '../components/MerchantCard';
import { merchantsApi } from '../services/api';
import { useMerchantStore } from '../store/merchantStore';
import type { Merchant } from '../types';

export default function HomeScreen() {
  const router = useRouter();
  const { merchants, loading, error, setMerchants, setLoading, setError } = useMerchantStore();

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return setError('Location permission denied');
      const loc = await Location.getCurrentPositionAsync({});
      const { data } = await merchantsApi.findNearby(loc.coords.latitude, loc.coords.longitude);
      setMerchants(data as Merchant[]);
    } catch {
      setError('Failed to load nearby merchants');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Nearby Spots' }} />
      <View style={s.root}>
        {loading && <ActivityIndicator size="large" color="#6366f1" style={s.loader} />}
        {!!error && <Text style={s.error}>{error}</Text>}
        <FlatList
          data={merchants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MerchantCard merchant={item} onPress={() => router.push(`/queue/${item.id}`)} />
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  list: { padding: 16 },
  loader: { marginTop: 48 },
  error: { color: '#ef4444', textAlign: 'center', margin: 16 },
});
