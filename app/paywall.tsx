import React, { useEffect, useState } from 'react';
import { Alert, Platform, Text } from 'react-native';
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
import { billing, Offering, PREVIEW_MODE } from '@/src/billing/subscription';
import { AccessCodeCard } from '@/src/components/access-code';
import { useApp } from '@/src/state/store';

const INCLUDES = [
  'Full birth-chart placements with written interpretations for every planet',
  'Your Week: the weekly outlook with real transit dates from your chart',
  'Compatibility readings with a second chart',
  'The full Learn library',
  'A saved-readings archive for the readings you want to keep',
  'Audio versions of Your Week, in production and included when ready',
];

export default function PaywallScreen() {
  const { entitlement, refreshEntitlement } = useApp();
  const router = useRouter();
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    billing.getOfferings().then(setOfferings).catch(() => setOfferings([]));
  }, []);

  async function buy(offering: Offering) {
    setBusy(true);
    try {
      await billing.purchase(offering.packageId);
      await refreshEntitlement();
      Alert.alert(
        'Premium is on',
        PREVIEW_MODE
          ? 'This is a preview build, so no payment was taken. Premium features are now open on this device.'
          : 'ASTRONO-ME Premium is active on this device.',
      );
      router.back();
    } catch (e) {
      Alert.alert('Purchase did not go through', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const manageUrl = billing.manageSubscriptionsUrl(Platform.OS === 'ios' ? 'ios' : 'android');

  return (
    <Screen>
      <Title>ASTRONO-ME Premium</Title>
      <Sub>Everything below is stated in full before you pay anything.</Sub>

      <Card>
        <SectionTitle>What Premium includes</SectionTitle>
        {INCLUDES.map((line) => (
          <Text key={line} style={{ fontSize: 16, color: colors.ink, lineHeight: 23 }}>
            {'·  '}
            {line}
          </Text>
        ))}
      </Card>

      {entitlement.active ? (
        <Card>
          <SectionTitle>Premium is active</SectionTitle>
          <Body>
            {entitlement.source === 'access-code'
              ? 'Premium was unlocked with an access code on this device. There is no subscription and nothing renews.'
              : entitlement.renewsOrEndsAt
                ? `Current period ends ${new Date(entitlement.renewsOrEndsAt).toDateString()}.`
                : 'Your subscription is active on this device.'}
          </Body>
          <Button label="Done" onPress={() => router.back()} />
        </Card>
      ) : (
        offerings.map((o) => (
          <Card key={o.packageId}>
            <SectionTitle>
              {o.priceString} — {o.cadence}
            </SectionTitle>
            {o.note ? <Body>{o.note}</Body> : null}
            <Body>
              No free trial — you will be charged when you confirm. The subscription renews
              automatically at {o.priceString} {o.packageId === 'monthly' ? 'each month' : 'each year'}{' '}
              until you cancel. You can cancel at any time in your store subscription settings;
              cancelling stops the next renewal and Premium stays on until the end of the
              period you have paid for. The free daily reading remains free either way.
            </Body>
            <Button
              label={`Subscribe — ${o.priceString} ${o.packageId === 'monthly' ? 'monthly' : 'yearly'}`}
              onPress={() => buy(o)}
              disabled={busy}
            />
          </Card>
        ))
      )}

      {!entitlement.active ? (
        <Button
          label="Restore a previous purchase"
          variant="quiet"
          onPress={async () => {
            await billing.restorePurchases();
            await refreshEntitlement();
          }}
        />
      ) : null}

      <AccessCodeCard />

      <Button
        label="Manage or cancel an existing subscription"
        variant="quiet"
        onPress={() => Linking.openURL(manageUrl)}
      />
      <Button label="Not now" variant="quiet" onPress={() => router.back()} />

      {PREVIEW_MODE ? (
        <Text style={{ fontSize: 12, color: colors.softInk, textAlign: 'center' }}>
          Preview build — billing not live. Purchases are simulated on this device and no
          payment is taken.
        </Text>
      ) : null}
    </Screen>
  );
}
