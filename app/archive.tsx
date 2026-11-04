import React from 'react';
import { Alert } from 'react-native';
import {
  Body,
  Button,
  Card,
  LockedState,
  Screen,
  Sub,
  Title,
} from '@/src/components/ui';
import { useApp } from '@/src/state/store';

export default function ArchiveScreen() {
  const { archive, entitlement, removeReading } = useApp();

  if (!entitlement.active) {
    return (
      <Screen>
        <Title>Saved readings</Title>
        <LockedState
          feature="The saved-readings archive"
          includes={[
            'Daily readings you choose to keep',
            'Weekly outlooks, saved week by week',
            'Compatibility readings for the charts you follow',
          ]}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Saved readings</Title>
      <Sub>Kept on this device. Deleting the app removes them.</Sub>
      {archive.length === 0 ? (
        <Body>
          Nothing saved yet. Use &quot;Save today&apos;s reading&quot; on the Today screen, or save a weekly
          outlook from Your Week.
        </Body>
      ) : (
        archive.map((r) => (
          <Card key={r.id}>
            <Sub>
              {r.kind === 'daily' ? 'Daily reading' : r.kind === 'weekly' ? 'Weekly outlook' : 'Compatibility'} ·{' '}
              {new Date(r.savedAt).toDateString()}
            </Sub>
            <Body>{r.title}</Body>
            <Body>{r.body}</Body>
            <Button
              label="Remove from archive"
              variant="quiet"
              onPress={() =>
                Alert.alert('Remove this reading?', 'It will be removed from this device.', [
                  { text: 'Keep it', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => removeReading(r.id) },
                ])
              }
            />
          </Card>
        ))
      )}
    </Screen>
  );
}
