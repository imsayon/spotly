import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TokenDisplayProps {
  tokenNumber: number;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Component to display token number prominently
 * Used in queue status screens
 */
export const TokenDisplay: React.FC<TokenDisplayProps> = ({
  tokenNumber,
  size = 'large',
}) => {
  const fontSize = size === 'small' ? 48 : size === 'medium' ? 64 : 80;
  const labelSize = size === 'small' ? 12 : 14;

  return (
    <View style={s.container}>
      <Text style={[s.label, { fontSize: labelSize }]}>Your Token</Text>
      <Text style={[s.token, { fontSize }]}>#{tokenNumber}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  label: {
    color: '#888',
    marginBottom: 8,
    fontWeight: '500',
  },
  token: {
    fontWeight: '800',
    color: '#111',
    lineHeight: 88,
  },
});
