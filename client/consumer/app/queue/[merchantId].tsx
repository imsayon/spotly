import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { TokenDisplay } from '../../components/TokenDisplay';
import { PositionTracker } from '../../components/PositionTracker';
import { StatusBadge } from '../../components/StatusBadge';
import { ErrorBanner } from '../../components/ErrorBanner';
import { NotificationBanner } from '../../components/NotificationBanner';
import { Loader } from '../../components/Loader';
import { useQueue } from '../../hooks/useQueue';
import { useQueueStatus, useQueueStatusRefresh } from '../../hooks/useQueueStatus';
import { useUserStore } from '../../store/userStore';

// TODO: Replace with real auth system
const MOCK_USER_ID = 'user-' + Math.random().toString(36).substr(2, 9);

export default function QueueScreen() {
  const { merchantId } = useLocalSearchParams<{ merchantId: string }>();
  const router = useRouter();
  const { user } = useUserStore();

  const {
    entry,
    loading,
    error,
    position,
    status,
    eta,
    connected,
    isJoined,
    isCalled,
    isServed,
    isMissed,
    join,
    leave,
    arrive,
    checkStatus,
    clearError,
  } = useQueue(merchantId || '');

  const queueStatus = useQueueStatus(5);
  const { refresh: refreshStatus } = useQueueStatusRefresh(entry?.id, 30000);

  const [showNotification, setShowNotification] = useState(false);

  // Handle join action
  const handleJoin = useCallback(async () => {
    try {
      await join(MOCK_USER_ID);
      setShowNotification(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to join queue. Please try again.');
    }
  }, [join]);

  // Handle leave action
  const handleLeave = useCallback(() => {
    Alert.alert('Leave Queue', 'Are you sure you want to leave?', [
      { text: 'Cancel' },
      {
        text: 'Leave',
        onPress: async () => {
          try {
            await leave();
            router.back();
          } catch (err) {
            Alert.alert('Error', 'Failed to leave queue.');
          }
        },
      },
    ]);
  }, [leave, router]);

  // Handle arrive action
  const handleArrive = useCallback(() => {
    Alert.prompt('Enter OTP', 'Please enter the OTP provided to complete service', [
      { text: 'Cancel' },
      {
        text: 'Confirm',
        onPress: async (otp) => {
          if (!otp) return;
          try {
            await arrive(otp);
            Alert.alert('Success', 'Thank you for using Spotly!');
            setTimeout(() => router.back(), 1500);
          } catch (err) {
            Alert.alert('Error', 'Invalid OTP. Please try again.');
          }
        },
      },
    ]);
  }, [arrive, router]);

  if (!merchantId) {
    return (
      <View style={s.center}>
        <Text style={s.error}>Invalid merchant</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.flex}
    >
      <Stack.Screen
        options={{
          title: isJoined ? 'Queue Status' : 'Join Queue',
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      />

      <ScrollView
        style={s.root}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Error Banner */}
        <ErrorBanner
          visible={!!error}
          message={error}
          onDismiss={clearError}
          type="error"
        />

        {/* Queue Called Notification */}
        <NotificationBanner
          visible={isCalled && showNotification}
          type="called"
          title="You're Called! 📢"
          message="Please proceed to the counter"
          action={{
            label: 'I Arrived',
            onPress: handleArrive,
          }}
          duration={10000}
          onDismiss={() => setShowNotification(false)}
        />

        {/* Position Alert Notification */}
        <NotificationBanner
          visible={queueStatus.shouldNotify}
          type="position-alert"
          title="Getting Close! 🔔"
          message={`You're #${position} - almost there!`}
          duration={5000}
        />

        {/* Loading State */}
        {loading ? (
          <Loader message="Processing..." />
        ) : isJoined ? (
          // Queue Status Screen
          <View style={s.statusContainer}>
            {/* Token */}
            <TokenDisplay tokenNumber={entry?.tokenNumber || 0} size="large" />

            {/* Status Badge */}
            <View style={s.statusRow}>
              {status && <StatusBadge status={status} size="medium" />}
              {connected ? (
                <Text style={s.connectionBadge}>🟢 Live</Text>
              ) : (
                <Text style={s.connectionBadgeDim}>🔴 Offline</Text>
              )}
            </View>

            {/* Position Tracker */}
            {status === 'WAITING' && (
              <PositionTracker position={position} eta={eta} status={status} />
            )}

            {/* Status Messages */}
            {isCalled && (
              <View style={s.statusMessage}>
                <Text style={s.statusMessageTitle}>🎉 You're Being Called!</Text>
                <Text style={s.statusMessageText}>
                  Please head to the counter now
                </Text>
              </View>
            )}

            {isServed && (
              <View style={s.statusMessage}>
                <Text style={s.statusMessageTitle}>✅ Service Complete</Text>
                <Text style={s.statusMessageText}>Thank you!</Text>
              </View>
            )}

            {isMissed && (
              <View style={[s.statusMessage, s.missedMessage]}>
                <Text style={s.statusMessageTitle}>⚠️ You Missed Your Turn</Text>
                <Text style={s.statusMessageText}>
                  You have been removed from queue
                </Text>
              </View>
            )}

            {/* Queue Stats */}
            {status === 'WAITING' && (
              <View style={s.statsCard}>
                <View style={s.statRow}>
                  <Text style={s.statLabel}>Token #</Text>
                  <Text style={s.statValue}>
                    {entry?.tokenNumber || '—'}
                  </Text>
                </View>
                <View style={[s.statRow, s.divider]}>
                  <Text style={s.statLabel}>Status</Text>
                  <Text style={s.statValue}>{status}</Text>
                </View>
                {eta !== null && (
                  <View style={[s.statRow, s.divider]}>
                    <Text style={s.statLabel}>Est. Wait</Text>
                    <Text style={s.statValue}>
                      {eta === 0 ? 'Soon' : `~${eta}m`}
                    </Text>
                  </View>
                )}
                <Text style={s.timestamp}>
                  Joined at{' '}
                  {entry?.createdAt
                    ? new Date(entry.createdAt).toLocaleTimeString()
                    : '—'}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={s.actions}>
              {!isServed && !isMissed && (
                <>
                  {isCalled && (
                    <Pressable style={s.primaryBtn} onPress={handleArrive}>
                      <Text style={s.primaryBtnText}>✓ I've Arrived</Text>
                    </Pressable>
                  )}
                  <Pressable style={s.secondaryBtn} onPress={handleLeave}>
                    <Text style={s.secondaryBtnText}>Leave Queue</Text>
                  </Pressable>
                </>
              )}
              {(isServed || isMissed) && (
                <Pressable style={s.primaryBtn} onPress={() => router.back()}>
                  <Text style={s.primaryBtnText}>Back to Spots</Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          // Join Screen
          <View style={s.joinContainer}>
            <View style={s.illustrationContainer}>
              <Text style={s.illustration}>🎫</Text>
            </View>

            <Text style={s.joinTitle}>Ready to Join?</Text>
            <Text style={s.joinSubtitle}>
              Get a token and track your position in real-time. No more guessing
              when it's your turn!
            </Text>

            <View style={s.joinFeatures}>
              <View style={s.joinFeature}>
                <Text style={s.joinFeatureIcon}>📍</Text>
                <Text style={s.joinFeatureText}>Track live position</Text>
              </View>
              <View style={s.joinFeature}>
                <Text style={s.joinFeatureIcon}>🔔</Text>
                <Text style={s.joinFeatureText}>Get notified when close</Text>
              </View>
              <View style={s.joinFeature}>
                <Text style={s.joinFeatureIcon}>⏱️</Text>
                <Text style={s.joinFeatureText}>See ETA</Text>
              </View>
            </View>

            <View style={s.actions}>
              <Pressable style={s.primaryBtn} onPress={handleJoin}>
                <Text style={s.primaryBtnText}>Join Queue Now</Text>
              </Pressable>
              <Pressable style={s.secondaryBtn} onPress={() => router.back()}>
                <Text style={s.secondaryBtnText}>Back</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: '#ef4444',
    fontSize: 16,
  },

  // Status Screen
  statusContainer: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
    gap: 8,
  },
  connectionBadge: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  connectionBadgeDim: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },

  statusMessage: {
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    padding: 16,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  missedMessage: {
    backgroundColor: '#fee2e2',
    borderLeftColor: '#ef4444',
  },
  statusMessageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  missedMessage__title: {
    color: '#7f1d1d',
  },
  statusMessageText: {
    fontSize: 14,
    color: '#166534',
  },

  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 6,
    paddingTop: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 12,
    fontStyle: 'italic',
  },

  // Join Screen
  joinContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  illustration: {
    fontSize: 80,
  },
  joinTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
    marginBottom: 8,
  },
  joinSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  joinFeatures: {
    gap: 12,
    marginBottom: 32,
  },
  joinFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  joinFeatureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  joinFeatureText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },

  // Actions
  actions: {
    gap: 12,
    marginTop: 24,
  },
  primaryBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 15,
  },
});

