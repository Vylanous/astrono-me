import React from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Body,
  Button,
  Card,
  LockedState,
  Screen,
  SectionTitle,
  Sub,
  Title,
  colors,
} from '@/src/components/ui';
import { useApp } from '@/src/state/store';
import { natalSections } from '@/src/engine/content';

export default function ChartScreen() {
  const { profile, chart, entitlement } = useApp();
  const router = useRouter();
  if (!profile || !chart) return null;

  const sections = natalSections(chart);
  const freeSections = sections.slice(0, 3); // Sun, Moon, Rising
  const paidSections = sections.slice(3); // Mercury through Pluto

  return (
    <Screen>
      <Title>Your birth chart</Title>
      <Sub>
        Born {profile.birthDate}
        {profile.birthTime ? ` at ${profile.birthTime}` : ' (birth time not given)'} in{' '}
        {chart.city.name}, {chart.city.province}
        {chart.placeApproximate ? ' — positions calculated from Toronto and approximate' : ''}.
      </Sub>

      {freeSections.map((s) => (
        <Card key={s.title}>
          <SectionTitle>{s.title}</SectionTitle>
          <Body>{s.body}</Body>
        </Card>
      ))}

      <Card>
        <SectionTitle>All your placements</SectionTitle>
        {chart.placements.map((p) => (
          <Text key={p.planet} style={{ fontSize: 16, color: colors.ink, lineHeight: 24 }}>
            {p.planet} in {p.sign} · {p.degree.toFixed(1)}°
          </Text>
        ))}
        {chart.rising ? (
          <Text style={{ fontSize: 16, color: colors.ink, lineHeight: 24 }}>
            Rising in {chart.rising.sign} · {chart.rising.degree.toFixed(1)}°
          </Text>
        ) : (
          <Text style={{ fontSize: 16, color: colors.softInk, lineHeight: 24 }}>
            Rising sign unavailable — no birth time given.
          </Text>
        )}
      </Card>

      {entitlement.active ? (
        <>
          {paidSections.map((s) => (
            <Card key={s.title}>
              <SectionTitle>{s.title}</SectionTitle>
              <Body>{s.body}</Body>
            </Card>
          ))}
          <Button
            label="Compatibility reading"
            variant="quiet"
            onPress={() => router.push('/compatibility')}
          />
        </>
      ) : (
        <>
          <LockedState
            feature="Written interpretations for every placement"
            includes={[
              'Mercury through Pluto, interpreted in writing',
              'Your Week: the weekly outlook with real transit dates',
              'Compatibility readings with a second chart',
              'The full Learn library and your saved-readings archive',
            ]}
          />
          <Button
            label="Compatibility reading (Premium)"
            variant="quiet"
            onPress={() => router.push('/compatibility')}
          />
        </>
      )}
    </Screen>
  );
}
