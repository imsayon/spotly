import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoaderProps {
  visible?: boolean;
  message?: string;
  size?: 'small' | 'large';
}

/**
 * Loading indicator component
 * Shows spinner with optional message
 */
export const Loader: React.FC<LoaderProps> = ({
  visible = true,
  message,
  size = 'large',
}) => {
  if (!visible) return null;

  return (
    <View style={s.container}>
      <ActivityIndicator
        size={size}
        color="#6366f1"
        style={s.spinner}
      />
      {message && <Text style={s.message}>{message}</Text>}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    marginHorizontal: 16,
  },
});
