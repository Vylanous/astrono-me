import React from 'react';
import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { colors } from '@/src/components/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          backgroundColor: colors.paper,
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '600', color: colors.ink }}>
          This screen does not exist.
        </Text>
        <Link href="/" style={{ fontSize: 16, color: colors.accent }}>
          Go to Today
        </Link>
      </View>
    </>
  );
}
