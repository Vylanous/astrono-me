import React, { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { Body, Button, Card, SectionTitle, colors } from './ui';
import { useApp } from '../state/store';
import { billing } from '../billing/subscription';

/**
 * "Have an access code?" — the redemption card shown on the paywall and in
 * Profile and settings. A correct code opens Premium permanently on this
 * device. Calm copy, plain error, no pressure.
 */
export function AccessCodeCard() {
  const { entitlement, refreshEntitlement } = useApp();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (done || (entitlement.active && entitlement.source === 'access-code')) {
    return (
      <Card>
        <SectionTitle>Access code</SectionTitle>
        <Body>
          Premium is unlocked on this device. Your Week, the full chart readings,
          compatibility, and the full Learn library are all open.
        </Body>
      </Card>
    );
  }

  // Premium is already active another way; a code would add nothing here.
  if (entitlement.active) return null;

  async function redeem() {
    setBusy(true);
    setError(null);
    try {
      const ok = await billing.redeemAccessCode(code);
      if (ok) {
        await refreshEntitlement();
        setCode('');
        setDone(true);
      } else {
        setError("That code doesn't match — check it and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionTitle>Have an access code?</SectionTitle>
      <Body>
        If you were given an access code, enter it here and Premium opens on this device.
        There is nothing to pay and nothing renews.
      </Body>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={(t) => {
          setCode(t);
          setError(null);
        }}
        placeholder="Access code"
        placeholderTextColor={colors.softInk}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label="Redeem" onPress={redeem} disabled={busy || code.trim().length === 0} />
    </Card>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.paper,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  error: { color: colors.danger, fontSize: 15, lineHeight: 21 },
});
