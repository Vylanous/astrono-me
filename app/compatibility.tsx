import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import {
  Body,
  Button,
  LockedState,
  PromptBlock,
  Screen,
  SectionTitle,
  Sub,
  Title,
  Card,
  colors,
} from '@/src/components/ui';
import { useApp } from '@/src/state/store';
import { natalChart } from '@/src/engine/ephemeris';
import { COMPATIBILITY_CONSENT, compatibilityReading } from '@/src/engine/content';

function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (y < 1900 || y > new Date().getFullYear()) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export default function CompatibilityScreen() {
  const { profile, chart, entitlement, partner, setPartner, saveReading } = useApp();
  const [name, setName] = useState(partner?.name ?? '');
  const [birthDate, setBirthDate] = useState(partner?.birthDate ?? '');
  const [birthplace, setBirthplace] = useState(partner?.birthplace ?? 'Toronto');
  const [error, setError] = useState<string | null>(null);

  const partnerChart = useMemo(() => {
    if (!partner) return null;
    return natalChart({
      birthDate: partner.birthDate,
      birthTime: partner.birthTime,
      birthplace: partner.birthplace,
      tone: 'Gentle',
      cadence: 'Daily',
    });
  }, [partner]);

  if (!profile || !chart) return null;

  if (!entitlement.active) {
    return (
      <Screen>
        <Title>Compatibility</Title>
        <Body>{COMPATIBILITY_CONSENT}</Body>
        <LockedState
          feature="Compatibility readings"
          includes={[
            'A second chart from a birth date you provide',
            'Sun-sign elements and both Moon signs, read together',
            'Written as tendencies and questions, never as a verdict',
          ]}
        />
      </Screen>
    );
  }

  const reading =
    partner && partnerChart
      ? compatibilityReading(profile.firstName ?? 'You', chart, partner.name, partnerChart)
      : null;

  return (
    <Screen>
      <Title>Compatibility</Title>
      <Body>{COMPATIBILITY_CONSENT}</Body>

      <Card>
        <SectionTitle>The second chart</SectionTitle>
        <Text style={styles.label}>Their first name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="For example, Sam"
          autoCapitalize="words"
        />
        <Text style={styles.label}>Their birth date</Text>
        <TextInput
          style={styles.input}
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Their birthplace (city)</Text>
        <TextInput
          style={styles.input}
          value={birthplace}
          onChangeText={setBirthplace}
          placeholder="For example, Halifax"
          autoCapitalize="words"
        />
        <Sub>
          If you do not know their birth time, leave the chart as date-only: the reading will
          use their Sun and Moon signs and skip the Rising sign, and say so.
        </Sub>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Read the two charts together"
          onPress={async () => {
            if (!name.trim()) {
              setError('Please add their first name — the reading is written to the two of you by name.');
              return;
            }
            if (!validDate(birthDate)) {
              setError('Please enter their birth date as YYYY-MM-DD.');
              return;
            }
            if (!birthplace.trim()) {
              setError('Please enter their birthplace city.');
              return;
            }
            setError(null);
            await setPartner({
              name: name.trim(),
              birthDate,
              birthTime: null,
              birthplace: birthplace.trim(),
            });
          }}
        />
        {partner ? (
          <Button label="Remove the second chart" variant="quiet" onPress={() => setPartner(null)} />
        ) : null}
      </Card>

      {reading ? (
        <>
          <SectionTitle>{reading.title}</SectionTitle>
          {reading.paragraphs.map((p, i) => (
            <Body key={i}>{p}</Body>
          ))}
          <PromptBlock>{reading.prompt}</PromptBlock>
          <Button
            label="Save this reading"
            variant="quiet"
            onPress={() =>
              saveReading({
                kind: 'compatibility',
                title: reading.title,
                body: [...reading.paragraphs, `For reflection: ${reading.prompt}`].join('\n\n'),
              })
            }
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: colors.softInk, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  error: { color: colors.danger, fontSize: 15, lineHeight: 21 },
});
