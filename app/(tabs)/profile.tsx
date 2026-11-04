import React, { useState } from 'react';
import { Alert, Platform, ScrollView, Text } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import {
  Body,
  Button,
  Card,
  Screen,
  SectionTitle,
  Sub,
  Title,
  colors,
} from '@/src/components/ui';
import { useApp } from '@/src/state/store';
import { AccessCodeCard } from '@/src/components/access-code';
import { billing, PREVIEW_MODE, cancelPreviewSubscription } from '@/src/billing/subscription';

export default function ProfileScreen() {
  const {
    profile,
    chart,
    entitlement,
    refreshEntitlement,
    exportData,
    deleteAllData,
  } = useApp();
  const router = useRouter();
  const [exported, setExported] = useState<string | null>(null);

  if (!profile || !chart) return null;

  const manageUrl = billing.manageSubscriptionsUrl(Platform.OS === 'ios' ? 'ios' : 'android');

  function confirmDelete() {
    Alert.alert(
      'Delete all my data',
      'This removes your birth profile, saved readings, and any second profile from this device, and resets ASTRONO-ME to its first-run state. It cannot be undone. If you have a store subscription, deleting app data does not cancel it — cancel in your store subscription settings as well.',
      [
        { text: 'Keep my data', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            await deleteAllData();
            router.replace('/onboarding');
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <Title>Profile and settings</Title>
      <Sub>Everything here is stored only on this device.</Sub>

      <Card>
        <SectionTitle>Your details</SectionTitle>
        <Body>
          {profile.firstName ? `${profile.firstName} · ` : ''}Born {profile.birthDate}
          {profile.birthTime ? ` at ${profile.birthTime}` : ', birth time not given'} in{' '}
          {profile.birthplace}
        </Body>
        <Body>
          Sun in {chart.sun.sign} · Moon in {chart.moon.sign} ·{' '}
          {chart.rising ? `Rising in ${chart.rising.sign}` : 'Rising sign unavailable'}
        </Body>
        <Body>
          Tone: {profile.tone} · Cadence: {profile.cadence}
        </Body>
        <Sub>
          To change any of this, delete your data below and set up again. There is no account
          and nothing to sign in to.
        </Sub>
      </Card>

      <Card>
        <SectionTitle>Subscription</SectionTitle>
        {entitlement.active ? (
          <>
            {entitlement.source === 'access-code' ? (
              <Body>
                ASTRONO-ME Premium is active on this device. It was unlocked with an access
                code, so there is no subscription to manage or cancel.
              </Body>
            ) : (
              <>
                <Body>
                  ASTRONO-ME Premium is active
                  {entitlement.renewsOrEndsAt
                    ? ` until ${new Date(entitlement.renewsOrEndsAt).toDateString()}`
                    : ''}
                  .
                </Body>
                {PREVIEW_MODE ? (
                  <>
                    <Sub>Preview build — this entitlement is simulated on this device only.</Sub>
                    <Button
                      label="End preview subscription"
                      variant="quiet"
                      onPress={async () => {
                        await cancelPreviewSubscription();
                        await refreshEntitlement();
                      }}
                    />
                  </>
                ) : null}
                <Button
                  label="Manage or cancel in store settings"
                  variant="quiet"
                  onPress={() => Linking.openURL(manageUrl)}
                />
              </>
            )}
          </>
        ) : (
          <>
            <Body>You are on the free tier. The daily reading, your Sun, Moon, and Rising placements, and two Learn articles are free.</Body>
            <Button label="See Premium and prices" onPress={() => router.push('/paywall')} />
            <Button
              label="Restore a previous purchase"
              variant="quiet"
              onPress={async () => {
                await billing.restorePurchases();
                await refreshEntitlement();
              }}
            />
          </>
        )}
      </Card>

      <AccessCodeCard />

      <Card>
        <SectionTitle>Your readings</SectionTitle>
        <Button label="Saved readings archive" variant="quiet" onPress={() => router.push('/archive')} />
        <Button label="How ASTRONO-ME works" variant="quiet" onPress={() => router.push('/how-it-works')} />
      </Card>

      <Card>
        <SectionTitle>Your data</SectionTitle>
        <Body>
          ASTRONO-ME stores your birth details and saved readings on this device only. Nothing
          is uploaded, sold, or shared.
        </Body>
        <Button
          label="Export my data"
          variant="quiet"
          onPress={async () => setExported(await exportData())}
        />
        {exported ? (
          <ScrollView style={{ maxHeight: 220, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 10 }}>
            <Text selectable style={{ fontSize: 12, color: colors.ink }}>
              {exported}
            </Text>
          </ScrollView>
        ) : null}
        <Button label="Delete all my data" variant="danger" onPress={confirmDelete} />
      </Card>
    </Screen>
  );
}
