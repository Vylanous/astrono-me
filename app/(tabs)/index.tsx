import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Body,
  Button,
  Card,
  PromptBlock,
  Screen,
  SectionTitle,
  Sub,
  Title,
} from '@/src/components/ui';
import { useApp } from '@/src/state/store';
import { transitsFor } from '@/src/engine/ephemeris';
import { dailyReading } from '@/src/engine/content';

export default function TodayScreen() {
  const { profile, chart, saveReading } = useApp();
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const transit = useMemo(() => transitsFor(today), [today]);

  if (!profile || !chart) return null;

  const reading = dailyReading(chart.sun.sign, profile.tone, today, transit);
  const greeting = profile.firstName ? `Good day, ${profile.firstName}.` : 'Good day.';

  return (
    <Screen>
      <Sub>{reading.subline}</Sub>
      <Title>{greeting}</Title>

      <Card>
        <SectionTitle>
          {reading.headline} · {transit.moonPhase.name}
        </SectionTitle>
        <Body>
          The Moon is in {transit.moonSign} today, {Math.round(transit.moonPhase.illumination * 100)}
          % lit and {transit.moonPhase.ageDays.toFixed(0)} days into its cycle. Your Sun is in{' '}
          {chart.sun.sign} and your Moon in {chart.moon.sign}
          {chart.rising ? `, with ${chart.rising.sign} rising` : ''}.
        </Body>
      </Card>

      {reading.paragraphs.map((p, i) => (
        <Body key={i}>{p}</Body>
      ))}

      <PromptBlock>{reading.prompt}</PromptBlock>

      <Button
        label="Save today's reading"
        variant="quiet"
        onPress={() =>
          saveReading({
            kind: 'daily',
            title: reading.headline,
            body: [...reading.paragraphs, `For reflection: ${reading.prompt}`].join('\n\n'),
          })
        }
      />
      <Button label="See your full chart" variant="quiet" onPress={() => router.push('/chart')} />
      <Text style={{ fontSize: 13, color: '#8A8496', lineHeight: 18 }}>
        Readings are written for reflection. They describe tendencies and timing, not events,
        and they are not a substitute for medical, financial, or legal advice.
      </Text>
    </Screen>
  );
}
