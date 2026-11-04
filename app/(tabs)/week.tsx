import React, { useMemo } from 'react';
import {
  Body,
  Button,
  Card,
  LockedState,
  Screen,
  SectionTitle,
  Sub,
  Title,
} from '@/src/components/ui';
import { useApp } from '@/src/state/store';
import { weeklyOutlook } from '@/src/engine/content';

export default function WeekScreen() {
  const { profile, chart, entitlement, saveReading } = useApp();
  const today = useMemo(() => new Date(), []);
  const outlook = useMemo(
    () => (chart && profile ? weeklyOutlook(chart, profile.tone, today) : null),
    [chart, profile, today],
  );

  if (!profile || !chart || !outlook) return null;

  if (!entitlement.active) {
    return (
      <Screen>
        <Title>Your Week</Title>
        <Sub>{outlook.rangeLabel}</Sub>
        <Body>
          The weekly outlook follows the Moon through its sign changes and quarter phases for
          the next seven days, with the actual dates, and notes where the Moon touches your
          own chart along the way.
        </Body>
        <LockedState
          feature="Your Week"
          includes={[
            'Every Moon sign change this week, with its date',
            'New, quarter, and Full Moon dates for the week',
            'The days the Moon aspects your natal Sun, Moon, and Saturn',
            'Saved to your archive whenever you like',
          ]}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Your Week</Title>
      <Sub>{outlook.rangeLabel}</Sub>
      <Body>{outlook.intro}</Body>

      {outlook.sections.map((s, i) => (
        <Card key={i}>
          <Sub>{s.dateLabel}</Sub>
          <SectionTitle>{s.title}</SectionTitle>
          <Body>{s.body}</Body>
        </Card>
      ))}

      {outlook.personalNotes.length > 0 ? (
        <Card>
          <SectionTitle>The Moon and your chart this week</SectionTitle>
          {outlook.personalNotes.map((n, i) => (
            <Body key={i}>{n}</Body>
          ))}
        </Card>
      ) : null}

      <Button
        label="Save this week to your archive"
        variant="quiet"
        onPress={() =>
          saveReading({
            kind: 'weekly',
            title: `Your Week — ${outlook.rangeLabel}`,
            body: [
              outlook.intro,
              ...outlook.sections.map((s) => `${s.dateLabel} — ${s.title}\n${s.body}`),
              ...outlook.personalNotes,
            ].join('\n\n'),
          })
        }
      />
    </Screen>
  );
}
