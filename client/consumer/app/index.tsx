import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
  Pressable,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter, Stack } from 'expo-router';
import { MerchantCard } from '../components/MerchantCard';
import { ErrorBanner } from '../components/ErrorBanner';
import { merchantsApi } from '../services/api';
import { useMerchantStore } from '../store/merchantStore';
import type { Merchant } from '../types';
import { MOCK_MERCHANTS } from '../types';

export default function HomeScreen() {
  const router = useRouter();
  const { merchants, loading, error, setMerchants, setLoading, setError } =
    useMerchantStore();
  const [displayMerchants, setDisplayMerchants] = useState<Merchant[]>(MOCK_MERCHANTS);

  useEffect(() => {
    // Show mock data immediately for testing
    setDisplayMerchants(MOCK_MERCHANTS);
  }, []);

  const loadMerchants = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      let lat = 40.7128; // NYC default
      let lng = -74.006;

      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        } catch (locErr) {
          console.warn('Could not get location, using default:', locErr);
        }
      }

      try {
        const { data } = await merchantsApi.findNearby(lat, lng);
        setMerchants(data as Merchant[]);
        setError(null);
      } catch (apiErr) {
        // Keep mock data if API fails
        console.log('Using mock merchants (API unavailable)');
        setMerchants(MOCK_MERCHANTS);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to load merchants';
      console.warn(errorMsg);
      // Keep showing mock data
      setMerchants(MOCK_MERCHANTS);
    } finally {
      setLoading(false);
    }
  };

  const handleMerchantSelect = (merchant: Merchant) => {
    router.push(`/queue/${merchant.id}`);
  };

  const renderEmpty = () => (
    <View style={s.emptyContainer}>
      <Text style={s.emptyEmoji}>🏪</Text>
      <Text style={s.emptyTitle}>No Merchants Found</Text>
      <Text style={s.emptyText}>
        Try enabling location or check your connection
      </Text>
      <Pressable style={s.retryBtn} onPress={() => loadMerchants()}>
        <Text style={s.retryBtnText}>Try Again</Text>
      </Pressable>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nearby Spots',
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
        }}
      />

      <View style={s.root}>
        {/* Error Banner */}
        <ErrorBanner
          visible={!!error}
          message={error}
          type="warning"
          onDismiss={() => setError(null)}
        />

        {/* Merchant List */}
        <FlatList
          data={displayMerchants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MerchantCard
              merchant={item}
              onPress={() => handleMerchantSelect(item)}
            />
          )}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadMerchants} />
          }
          ListEmptyComponent={!loading ? renderEmpty : null}
          ListHeaderComponent={
            loading ? (
              <ActivityIndicator
                size="large"
                color="#6366f1"
                style={s.loader}
              />
            ) : null
          }
        />
      </View>
    </>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  loader: {
    marginVertical: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

