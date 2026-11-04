import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '@/src/state/store';
import { colors } from '@/src/components/ui';

export { ErrorBoundary } from 'expo-router';

function Gate({ children }: { children: React.ReactNode }) {
  const { loading, profile } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const onOnboarding = segments[0] === 'onboarding';
    if (!profile && !onOnboarding) {
      router.replace('/onboarding');
    } else if (profile && onOnboarding) {
      router.replace('/');
    }
  }, [loading, profile, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Gate>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.paper },
            headerTintColor: colors.ink,
            contentStyle: { backgroundColor: colors.paper },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', title: 'ASTRONO-ME Premium' }} />
          <Stack.Screen name="compatibility" options={{ title: 'Compatibility' }} />
          <Stack.Screen name="archive" options={{ title: 'Saved readings' }} />
          <Stack.Screen name="article/[id]" options={{ title: 'Learn' }} />
          <Stack.Screen name="how-it-works" options={{ title: 'How ASTRONO-ME works' }} />
        </Stack>
      </Gate>
    </AppProvider>
  );
}
