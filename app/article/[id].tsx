import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  Body,
  LockedState,
  Screen,
  SectionTitle,
  Sub,
  Title,
} from '@/src/components/ui';
import { useApp } from '@/src/state/store';
import { articleById } from '@/src/engine/content';

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entitlement } = useApp();
  const article = articleById(id ?? '');

  if (!article) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Learn' }} />
        <Title>Article not found</Title>
        <Body>This article is not part of the library on this device.</Body>
      </Screen>
    );
  }

  if (article.premium && !entitlement.active) {
    return (
      <Screen>
        <Stack.Screen options={{ title: article.title }} />
        <Title>{article.title}</Title>
        <Body>{article.standfirst}</Body>
        <Sub>{article.minutes} minutes</Sub>
        <LockedState
          feature="This article"
          includes={[
            'The full Learn library: houses, transits, Mercury retrograde, and more',
            'Full chart interpretations and Your Week',
            'Compatibility readings and the saved-readings archive',
          ]}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: article.title }} />
      <Title>{article.title}</Title>
      <Body>{article.standfirst}</Body>
      <Sub>{article.minutes} minutes</Sub>
      {article.sections.map((s, i) => (
        <React.Fragment key={i}>
          {s.heading ? <SectionTitle>{s.heading}</SectionTitle> : null}
          {s.paragraphs.map((p, j) => (
            <Body key={j}>{p}</Body>
          ))}
        </React.Fragment>
      ))}
    </Screen>
  );
}
