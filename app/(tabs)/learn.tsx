import React from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Card, Screen, Sub, Title, colors } from '@/src/components/ui';
import { useApp } from '@/src/state/store';
import { ARTICLES, AUDIO_ENTRIES } from '@/src/engine/content';

export default function LearnScreen() {
  const { entitlement } = useApp();
  const router = useRouter();

  return (
    <Screen>
      <Title>Learn</Title>
      <Sub>
        Short articles on how astrology actually works, in plain English. The first two are
        free; the rest are part of Premium.
      </Sub>

      {ARTICLES.map((a) => {
        const locked = a.premium && !entitlement.active;
        return (
          <Pressable key={a.id} onPress={() => router.push(`/article/${a.id}`)}>
            <Card>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink, lineHeight: 24 }}>
                {a.title}
                {locked ? '  ·  Premium' : ''}
              </Text>
              <Body>{a.standfirst}</Body>
              <Sub>{a.minutes} minutes</Sub>
            </Card>
          </Pressable>
        );
      })}

      <Card>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink }}>Listen</Text>
        {AUDIO_ENTRIES.map((entry) => (
          <React.Fragment key={entry.id}>
            <Body>
              {entry.title} — coming with Premium. {entry.detail}
            </Body>
          </React.Fragment>
        ))}
        <Sub>
          Audio is in production. It is listed here so you know exactly what Premium will
          include, and it is not charged as a separate item.
        </Sub>
      </Card>
    </Screen>
  );
}
