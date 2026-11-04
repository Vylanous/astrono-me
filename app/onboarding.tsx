import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Card, Screen, Sub, Title, colors } from '@/src/components/ui';
import { findCity } from '@/src/engine/ephemeris';
import { useApp } from '@/src/state/store';

function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (y < 1900 || y > new Date().getFullYear()) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function validTime(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function Onboarding() {
  const { saveProfile } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [birthplace, setBirthplace] = useState('');
  const [tone, setTone] = useState<'Gentle' | 'Direct'>('Gentle');
  const [cadence, setCadence] = useState<'Daily' | 'Weekly'>('Daily');
  const [error, setError] = useState<string | null>(null);

  const place = useMemo(() => findCity(birthplace), [birthplace]);

  async function finish() {
    await saveProfile({
      firstName: firstName.trim() || undefined,
      birthDate,
      birthTime: timeUnknown ? null : birthTime,
      birthplace: birthplace.trim(),
      tone,
      cadence,
    });
    router.replace('/');
  }

  function nextFromStep2() {
    if (!validDate(birthDate)) {
      setError('Please enter your birth date as YYYY-MM-DD, for example 1990-04-17.');
      return;
    }
    setError(null);
    setStep(2);
  }

  function nextFromStep3() {
    if (!timeUnknown && !validTime(birthTime)) {
      setError('Please enter your birth time as HH:MM in 24-hour time, or choose "I don\'t know my birth time".');
      return;
    }
    if (!birthplace.trim()) {
      setError('Please enter the city you were born in.');
      return;
    }
    setError(null);
    setStep(3);
  }

  return (
    <Screen>
      <Sub>Step {step + 1} of 4</Sub>

      {step === 0 && (
        <>
          <Title>Understand the week through your chart</Title>
          <Body>
            ASTRONO-ME is a Canadian astrology companion for reflection. Each day it reads the
            Moon&apos;s actual position against your birth chart and gives you a short, plain
            reading — written by astrologers&apos; methods, not generated on the spot, and never
            dressed up as a prediction.
          </Body>
          <Card>
            <Body>What is free, always:</Body>
            <Text style={styles.bullet}>·  A daily reading based on your Sun sign and today&apos;s Moon</Text>
            <Text style={styles.bullet}>·  Your Sun, Moon, and Rising placements</Text>
            <Text style={styles.bullet}>·  The first two Learn articles</Text>
          </Card>
          <Body>
            Everything is stored on this device. There is no account, and nothing here is
            medical, financial, or legal advice.
          </Body>
          <Button label="Begin" onPress={() => setStep(1)} />
        </>
      )}

      {step === 1 && (
        <>
          <Title>Your name and birth date</Title>
          <Sub>Your first name is optional. Your birth date sets your Sun and Moon signs.</Sub>
          <Text style={styles.label}>First name (optional)</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="For example, Alex"
            autoCapitalize="words"
          />
          <Text style={styles.label}>Birth date</Text>
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Continue" onPress={nextFromStep2} />
          <Button label="Back" variant="quiet" onPress={() => setStep(0)} />
        </>
      )}

      {step === 2 && (
        <>
          <Title>Birth time and place</Title>
          <Sub>
            Your birth time sets your Rising sign. If you do not know it, say so — ASTRONO-ME
            will leave the Rising sign out rather than guess at it.
          </Sub>
          <Text style={styles.label}>Birth time (24-hour)</Text>
          <TextInput
            style={[styles.input, timeUnknown && styles.inputDisabled]}
            value={birthTime}
            onChangeText={setBirthTime}
            placeholder="HH:MM, for example 14:35"
            keyboardType="numbers-and-punctuation"
            editable={!timeUnknown}
            autoCapitalize="none"
          />
          <View style={styles.switchRow}>
            <Text style={styles.bodyText}>I don&apos;t know my birth time</Text>
            <Switch value={timeUnknown} onValueChange={setTimeUnknown} />
          </View>
          {timeUnknown ? (
            <Body>
              Understood. Your Rising sign will be shown as unavailable. If you find your
              birth time later — it is often recorded on a long-form birth certificate — you
              can add it in your profile.
            </Body>
          ) : null}
          <Text style={styles.label}>Birthplace (city)</Text>
          <TextInput
            style={styles.input}
            value={birthplace}
            onChangeText={setBirthplace}
            placeholder="For example, Winnipeg"
            autoCapitalize="words"
          />
          {birthplace.trim() ? (
            <Body>
              {place.approximate
                ? `ASTRONO-ME does not have ${birthplace.trim()} in its built-in list yet, so positions will be calculated from Toronto and labelled approximate. The Sun and Moon signs are not affected.`
                : `Matched: ${place.city.name}, ${place.city.province}.`}
            </Body>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Continue" onPress={nextFromStep3} />
          <Button label="Back" variant="quiet" onPress={() => setStep(1)} />
        </>
      )}

      {step === 3 && (
        <>
          <Title>How you would like to read</Title>
          <Sub>These change the writing, not the astrology. You can change them any time in your profile.</Sub>
          <Text style={styles.label}>Tone</Text>
          <View style={styles.choiceRow}>
            <Choice label="Gentle" selected={tone === 'Gentle'} onPress={() => setTone('Gentle')} />
            <Choice label="Direct" selected={tone === 'Direct'} onPress={() => setTone('Direct')} />
          </View>
          <Body>
            Gentle readings leave more room around a hard day. Direct readings say the same
            thing in fewer, plainer words.
          </Body>
          <Text style={styles.label}>Reading cadence</Text>
          <View style={styles.choiceRow}>
            <Choice label="Daily" selected={cadence === 'Daily'} onPress={() => setCadence('Daily')} />
            <Choice label="Weekly" selected={cadence === 'Weekly'} onPress={() => setCadence('Weekly')} />
          </View>
          <Body>
            Your preference is kept on this device and used to shape your home screen. The
            daily reading is there either way.
          </Body>
          <Button label="Save and see today's reading" onPress={finish} />
          <Button label="Back" variant="quiet" onPress={() => setStep(2)} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: colors.softInk, marginTop: 6 },
  bodyText: { fontSize: 16, color: colors.ink },
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
  inputDisabled: { opacity: 0.4 },
  error: { color: colors.danger, fontSize: 15, lineHeight: 21 },
  bullet: { fontSize: 16, color: colors.ink, lineHeight: 23 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  choiceRow: { flexDirection: 'row', gap: 10 },
  choice: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  choiceSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  choiceText: { fontSize: 16, color: colors.ink, fontWeight: '500' },
  choiceTextSelected: { color: colors.accent, fontWeight: '700' },
});
