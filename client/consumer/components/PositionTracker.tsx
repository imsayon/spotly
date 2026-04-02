import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface PositionTrackerProps {
  position: number | null;
  eta: number | null;
  status: string;
}

/**
 * Component to display current position in queue and ETA
 * Shows animated position changes
 */
export const PositionTracker: React.FC<PositionTrackerProps> = ({
  position,
  eta,
  status,
}) => {
  if (position === null || status !== 'WAITING') {
    return null;
  }

  const getPositionText = () => {
    if (position === 0) return "You're next! 🎉";
    if (position === 1) return '1 person ahead of you';
    return `${position} people ahead of you`;
  };

  return (
    <View style={s.container}>
      <View style={s.card}>
        {/* Position */}
        <View style={s.row}>
          <Text style={s.label}>People Ahead</Text>
          <Text style={s.value}>{position}</Text>
        </View>

        {/* ETA */}
        {eta !== null && (
          <View style={[s.row, s.divider]}>
            <Text style={s.label}>Estimated Wait</Text>
            <Text style={s.value}>
              {eta === 0 ? 'Soon' : `~${eta} min`}
            </Text>
          </View>
        )}

        {/* Position message */}
        <Text style={s.message}>{getPositionText()}</Text>
      </View>

      {/* Progress indicator */}
      <View style={s.progressBar}>
        <View
          style={[
            s.progress,
            {
              width: position === 0 ? '100%' : `${Math.max(25, 100 - position * 10)}%`,
            },
          ]}
        />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 12,
  },
  label: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366f1',
  },
  message: {
    fontSize: 14,
    color: '#555',
    marginTop: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
});
